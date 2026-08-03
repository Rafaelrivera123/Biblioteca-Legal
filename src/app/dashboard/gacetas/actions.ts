"use server";

import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  extractPdfText,
  loadGacetaPdfBuffer,
  processPendingGacetas,
} from "@/lib/gaceta-processor";
import { revalidatePath } from "next/cache";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");
}

/**
 * Recorta a un máximo de palabras, igual que `buildGacetaDescription` en
 * gaceta-processor.ts. Se duplica acá (en vez de importarla) para no
 * depender de que ese módulo exporte un helper interno — este archivo ya
 * hace su propia llamada a la IA con un prompt distinto.
 */
function capWords(text: string, maxWords = 40): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

/**
 * Extrae la oración generada por la IA del bloque `<description>...
 * </description>` que le pedimos en el prompt. Antes se usaba el texto
 * completo de la respuesta tal cual, y en la práctica el modelo a veces
 * agregaba una frase introductoria antes de la oración de verdad (ej. "De
 * acuerdo a lo solicitado, aquí está la oración resumen:..."). Eso rompía
 * dos cosas a la vez: la descripción quedaba con una introducción de
 * relleno en vez de ir directo al contenido, y como `capWords` cuenta
 * palabras sobre el texto completo, el recorte de 40 palabras se comía esa
 * introducción y cortaba la oración real a mitad de camino (ej. terminaba
 * en "...reglamento de…"). Pedirle a la IA que envuelva SOLO la oración en
 * esas etiquetas, y quedarnos únicamente con lo que hay adentro, evita
 * ambos problemas de raíz. Si por algún motivo la IA no usa las etiquetas,
 * se cae de vuelta al texto completo tal cual.
 */
function extractDescriptionTag(rawText: string): string {
  const match = rawText.match(/<description>([\s\S]*?)<\/description>/i);
  return (match ? match[1] : rawText).trim();
}

/**
 * Registra en Neon (Postgres) una Gaceta cuyo PDF ya se subió directo del
 * navegador a Vercel Blob (ver /api/gacetas/upload y UploadGacetasModal).
 * El binario nunca llega a este Server Action — solo la URL que devolvió
 * Blob — así que el tamaño del PDF ya no importa: antes el archivo entero
 * viajaba en el body del Server Action hacia Neon, y Vercel impone un
 * límite duro de 4.5MB por request/response de Function que no se puede
 * evitar subiendo `bodySizeLimit` en next.config.mjs (ese límite es de
 * Next.js, no de la plataforma). Cualquier Gaceta más pesada que eso
 * fallaba siempre, sin importar la configuración.
 */
export async function createGacetaFromFile(input: {
  number: string;
  fileName: string;
  url: string;
}): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();

  const number = input.number?.trim();
  const fileName = input.fileName?.trim();
  const url = input.url?.trim();

  if (!number) return { ok: false, message: "Falta el número de Gaceta." };
  if (!fileName || !url) return { ok: false, message: "Falta el archivo." };

  const existing = await prisma.gaceta.findUnique({ where: { number } });
  if (existing) {
    return { ok: false, message: `Ya existe una Gaceta con el número ${number}.` };
  }

  await prisma.gaceta.create({
    data: {
      number,
      fileName,
      pdfUrl: url,
      fileAvailable: true,
      status: "pending",
    },
  });

  revalidatePath("/dashboard/gacetas");
  return { ok: true, message: "Gaceta agregada a la cola." };
}

export async function retryGaceta(id: string) {
  await requireAdmin();
  const gaceta = await prisma.gaceta.findUnique({ where: { id } });
  if (!gaceta) throw new Error("Gaceta no encontrada.");
  if (!gaceta.pdfUrl && !gaceta.pdfData) {
    throw new Error("Esta Gaceta ya no tiene el archivo guardado — bórrala y súbela de nuevo.");
  }
  await prisma.gaceta.update({
    where: { id },
    data: { status: "pending", errorMessage: null },
  });
  revalidatePath("/dashboard/gacetas");
}

export async function deleteGaceta(id: string) {
  await requireAdmin();
  await prisma.gaceta.delete({ where: { id } });
  revalidatePath("/dashboard/gacetas");
}

/**
 * Permite corregir a mano la descripción corta que se muestra en la
 * tarjeta pública de /gacetas. Se genera sola al procesar la Gaceta (ver
 * `buildGacetaDescription` en gaceta-processor.ts), pero el admin puede
 * ajustarla aquí si el resumen automático no queda claro. Un string vacío
 * la deja en null (vuelve al estado "sin descripción").
 */
export async function updateGacetaDescription(id: string, description: string) {
  await requireAdmin();
  const trimmed = description.trim();
  await prisma.gaceta.update({
    where: { id },
    data: { description: trimmed.length > 0 ? trimmed : null },
  });
  revalidatePath("/dashboard/gacetas");
  revalidatePath("/gacetas");
}

// Cuánto texto del PDF le pasamos a la IA cuando no hay actualizaciones
// legales generadas todavía (ver `generateGacetaDescriptionAI` abajo). No
// necesitamos el análisis completo artículo por artículo para escribir una
// sola oración de resumen general, así que basta con un extracto — esto
// mantiene la llamada rápida y barata en vez de repetir el análisis
// completo de `analyzeGacetaText`.
const DESCRIPTION_FALLBACK_EXCERPT_CHARS = 150_000;

/**
 * Genera con IA una descripción corta (≤40 palabras) de qué contiene una
 * Gaceta, para el botón "Generar con IA" del modal de edición. NO la
 * guarda — solo la devuelve para que el admin la revise en el textarea y
 * la confirme con "Guardar" (ver `updateGacetaDescription`).
 *
 * Si la Gaceta ya tiene actualizaciones legales generadas (reformas, leyes
 * nuevas, derogaciones), arma la descripción a partir de esas — es lo más
 * preciso y barato. Si todavía NO tiene ninguna (Gaceta pendiente, en cola,
 * o procesada pero sin cambios relevantes detectados), el botón igual debe
 * funcionar: en ese caso leemos el PDF original directo y le pedimos a la
 * IA un resumen general de qué trae, sin pasar por el análisis completo.
 */
export async function generateGacetaDescriptionAI(id: string): Promise<{ description: string }> {
  await requireAdmin();

  const gaceta = await prisma.gaceta.findUnique({
    where: { id },
    select: { number: true, pdfUrl: true, pdfData: true },
  });
  if (!gaceta) throw new Error("Gaceta no encontrada.");

  const updates = await prisma.legalUpdatePost.findMany({
    where: { gacetaNumber: gaceta.number },
    select: { title: true, summary: true, type: true },
  });

  let prompt: string;

  // Se le pide a la IA que devuelva la oración envuelta en <description>
  // ...</description> y NADA más — ver `extractDescriptionTag` arriba
  // sobre por qué (evita frases introductorias que antes rompían tanto el
  // formato como el recorte de 40 palabras).
  const formatInstruction = `No agregues ninguna introducción, saludo, ni explicación de que estás cumpliendo la instrucción (nada de "De acuerdo a lo solicitado...", "Aquí está...", etc.). No uses viñetas, markdown ni comillas. Responde ÚNICAMENTE con este formato exacto, sin nada antes ni después: <description>tu oración aquí</description>`;

  if (updates.length > 0) {
    const list = updates
      .map((u, i) => `${i + 1}. [${u.type}] ${u.title} — ${u.summary}`)
      .join("\n");
    prompt = `Eres un editor de contenido legal para Honduras. A partir de las actualizaciones legales que identificamos en La Gaceta N° ${gaceta.number}, escribe UNA sola oración en español, natural y clara, de máximo 40 palabras, que resuma qué contiene esta edición para mostrarla en una tarjeta pública. ${formatInstruction}

Actualizaciones identificadas:
${list}`;
  } else {
    const pdfBuffer = await loadGacetaPdfBuffer(gaceta.pdfUrl, gaceta.pdfData);
    const fullText = await extractPdfText(pdfBuffer);
    const excerpt = fullText.slice(0, DESCRIPTION_FALLBACK_EXCERPT_CHARS);
    const truncatedNote =
      fullText.length > excerpt.length ? " (mostrado parcialmente por su extensión)" : "";
    prompt = `Eres un editor de contenido legal para Honduras. Este es el texto de La Gaceta N° ${gaceta.number} (diario oficial de Honduras)${truncatedNote}. Todavía no tiene un análisis legal generado, así que escribe UNA sola oración en español, natural y clara, de máximo 40 palabras, que resuma de qué trata esta edición en general (por ejemplo, qué tipo de decretos, leyes, acuerdos o avisos contiene), para mostrarla en una tarjeta pública. ${formatInstruction}

Texto de la Gaceta:
${excerpt}`;
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  const rawText = block?.type === "text" ? block.text.trim() : "";
  if (!rawText) {
    throw new Error("La IA no devolvió una descripción. Intenta de nuevo.");
  }

  const text = extractDescriptionTag(rawText);
  if (!text) {
    throw new Error("La IA no devolvió una descripción. Intenta de nuevo.");
  }

  return { description: capWords(text) };
}

// Tope de Gacetas por click en "Procesar ahora". Con colas de 100+ Gacetas,
// sin este tope un solo click podía consumirse el rato entero de cómputo
// procesando decenas de golpe; con esto cada click es corto, predecible en
// costo, y se puede ir dando seguimiento de a poco.
const MAX_GACETAS_PER_CLICK = 5;

/**
 * Dispara el mismo procesamiento que corre el cron, pero al toque, para que
 * el admin no tenga que esperar al próximo horario programado para probar
 * que una Gaceta recién subida se procesa bien. A diferencia del cron, cada
 * click procesa como máximo MAX_GACETAS_PER_CLICK Gacetas.
 *
 * El 250_000 que estaba acá antes dejaba solo ~50s de margen bajo los 300s
 * de `maxDuration` (ver page.tsx) para todo el trabajo de una Gaceta además
 * de la llamada a la IA (descarga del PDF, extracción de texto, escrituras
 * a Prisma) — muy poco margen real. Eso hacía que Vercel matara la función
 * a mitad de camino en vez de dejar que el propio código detectara el
 * timeout y marcara la Gaceta como "failed": el resultado era que el botón
 * se quedaba "Procesando..." para siempre y la fila quedaba atascada en
 * "processing" sin ningún error visible. 60_000 deja margen real (~240s)
 * para que la Gaceta en curso siempre termine dentro del tiempo, bien o mal.
 */
export async function processGacetasNow() {
  await requireAdmin();
  const summary = await processPendingGacetas(60_000, MAX_GACETAS_PER_CLICK);
  revalidatePath("/dashboard/gacetas");
  revalidatePath("/dashboard/legal-updates");
  return summary;
}
