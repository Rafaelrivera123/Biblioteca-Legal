"use server";

import Anthropic from "@anthropic-ai/sdk";
import { del } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  buildGacetaDescriptionFromUpdates,
  capWords,
  DESCRIPTION_PDF_MAX_PAGES,
  extractPdfTextForDescription,
  loadGacetaPdfBuffer,
  processPendingGacetas,
  slicePdfFirstPages,
} from "@/lib/gaceta-processor";
import { revalidatePath } from "next/cache";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Tras recortar a DESCRIPTION_PDF_MAX_PAGES, el PDF es chico; este tope
// solo evita mandar basura enorme si el slice fallara.
const MAX_SLICED_PDF_BYTES = 5 * 1024 * 1024;

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Traduce errores típicos de Anthropic / red a mensajes accionables en
 * español. Antes el admin veía dumps crudos o el toast genérico de Next.
 */
function friendlyAiError(err: unknown): string {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return "Falta configurar ANTHROPIC_API_KEY en el entorno del servidor.";
  }

  const status =
    err && typeof err === "object" && "status" in err
      ? Number((err as { status?: unknown }).status)
      : undefined;
  const message = errorMessage(err);

  if (status === 401 || /invalid.*api.?key|authentication/i.test(message)) {
    return "La clave de Anthropic (ANTHROPIC_API_KEY) es inválida o no está autorizada.";
  }
  if (status === 429 || /rate.?limit|too many requests/i.test(message)) {
    return "Se alcanzó el límite de uso de la API de Anthropic. Espera un momento e intenta de nuevo.";
  }
  if (status === 413 || /request.?too.?large|payload/i.test(message)) {
    return "El archivo es demasiado grande para la IA. Escribe la descripción a mano o divide el PDF.";
  }
  if (
    (err instanceof Error && err.name === "APIConnectionTimeoutError") ||
    /timed? ?out/i.test(message)
  ) {
    return "La IA tardó demasiado en responder. Intenta de nuevo; si sigue fallando, escribe la descripción a mano.";
  }
  if (/credit|billing|quota|insufficient/i.test(message)) {
    return "No hay crédito / cuota disponible en la cuenta de Anthropic. Revisa el billing e intenta de nuevo.";
  }

  return message || "No se pudo generar la descripción con IA. Intenta de nuevo o escríbela a mano.";
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
  const gaceta = await prisma.gaceta.findUnique({
    where: { id },
    select: { pdfUrl: true },
  });
  if (gaceta?.pdfUrl) {
    try {
      await del(gaceta.pdfUrl);
    } catch (err) {
      console.error("[deleteGaceta] No se pudo borrar Blob:", gaceta.pdfUrl, err);
    }
  }
  await prisma.gaceta.delete({ where: { id } });
  revalidatePath("/dashboard/gacetas");
}

/**
 * Permite corregir a mano la descripción corta que se muestra en la
 * tarjeta pública de /gacetas. Se genera sola al procesar la Gaceta (ver
 * `buildGacetaDescription` en gaceta-processor.ts), pero el admin puede
 * ajustarla aquí si el resumen automático no queda claro. Un string vacío
 * la deja en null (vuelve al estado "sin descripción").
 *
 * Devuelve `{ ok, message }` en vez de tirar: en producción Next.js
 * redacta cualquier Error de Server Action a un mensaje genérico de
 * "Server Components render", así que un throw dejaría al admin sin
 * saber qué falló.
 */
export async function updateGacetaDescription(
  id: string,
  description: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await requireAdmin();
    const trimmed = description.trim();
    await prisma.gaceta.update({
      where: { id },
      data: { description: trimmed.length > 0 ? trimmed : null },
    });
    revalidatePath("/dashboard/gacetas");
    revalidatePath("/gacetas");
    return { ok: true };
  } catch (err) {
    console.error("[updateGacetaDescription]", err);
    return { ok: false, message: errorMessage(err) || "No se pudo guardar la descripción." };
  }
}

// Extracto para descripción con Haiku. Una oración de tarjeta no necesita
// el PDF entero: ~8k caracteres (~2k tokens) bastan y cortan el costo vs
// los 30k/150k anteriores.
const DESCRIPTION_FALLBACK_EXCERPT_CHARS = 8_000;

type DescriptionResult =
  | { ok: true; description: string; source: "updates" | "ai-text" | "ai-pdf" }
  | { ok: false; message: string };

const FORMAT_INSTRUCTION = `No agregues ninguna introducción, saludo, ni explicación de que estás cumpliendo la instrucción (nada de "De acuerdo a lo solicitado...", "Aquí está...", etc.). No uses viñetas, markdown ni comillas. Responde ÚNICAMENTE con este formato exacto, sin nada antes ni después: <description>tu oración aquí</description>`;

async function askHaikuForDescription(
  content: Anthropic.MessageCreateParams["messages"][number]["content"]
): Promise<string> {
  // Tarea trivial (una sola oración de máximo 40 palabras): claude-sonnet-5
  // es innecesariamente caro para esto. haiku-4-5 da el mismo resultado a
  // una fracción del costo por token — mismo modelo que ya usa
  // batch-create/route.ts para tareas igual de simples.
  const response = await anthropic.messages.create(
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content }],
    },
    { timeout: 60_000 }
  );

  const block = response.content[0];
  const rawText = block?.type === "text" ? block.text.trim() : "";
  if (!rawText) {
    throw new Error("La IA no devolvió una descripción. Intenta de nuevo.");
  }
  const text = extractDescriptionTag(rawText);
  if (!text) {
    throw new Error("La IA no devolvió una descripción. Intenta de nuevo.");
  }
  return capWords(text);
}

/**
 * Último recurso: pdf-parse no pudo leer el PDF. Mandamos SOLO las
 * primeras páginas a Claude (document API). Enviar la Gaceta entera era
 * la causa principal de errores y de quemar créditos (cada página se
 * cobra como texto + imagen).
 */
async function describeFromPdfDocument(
  pdfBuffer: Buffer,
  gacetaNumber: string
): Promise<string> {
  let sliced: { buffer: Buffer; totalPages: number; usedPages: number };
  try {
    sliced = await slicePdfFirstPages(pdfBuffer, DESCRIPTION_PDF_MAX_PAGES);
  } catch (err) {
    console.error("[describeFromPdfDocument] slice falló:", err);
    throw new Error(
      "No se pudo preparar el PDF para la IA (estructura no soportada). Escribe la descripción a mano."
    );
  }

  if (sliced.buffer.length > MAX_SLICED_PDF_BYTES) {
    throw new Error(
      "Este PDF es demasiado denso incluso en las primeras páginas. Escríbela a mano."
    );
  }

  const pageNote =
    sliced.totalPages > sliced.usedPages
      ? ` (solo las primeras ${sliced.usedPages} de ${sliced.totalPages} páginas, para ahorrar costo)`
      : "";

  return askHaikuForDescription([
    {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: sliced.buffer.toString("base64"),
      },
    },
    {
      type: "text",
      text: `Eres un editor de contenido legal para Honduras. Este es un extracto del PDF de La Gaceta N° ${gacetaNumber}${pageNote}. Todavía no tiene un análisis legal generado, así que escribe UNA sola oración en español, natural y clara, de máximo 40 palabras, que resuma de qué trata esta edición en general (por ejemplo, qué tipo de decretos, leyes, acuerdos o avisos contiene), para mostrarla en una tarjeta pública. ${FORMAT_INSTRUCTION}`,
    },
  ]);
}

/**
 * Genera una descripción corta (≤40 palabras) para el botón "Generar con IA".
 * NO la guarda — el admin revisa en el textarea y confirma con Guardar.
 *
 * Orden de costo (barato → caro):
 * 1. Si ya hay actualizaciones legales → armar la oración SIN llamar a la IA.
 * 2. Si no: extracto corto de texto (Haiku).
 * 3. Si pdf-parse falla: primeras 3 páginas vía document API (Haiku).
 */
export async function generateGacetaDescriptionAI(
  id: string
): Promise<DescriptionResult> {
  try {
    await requireAdmin();

    const gaceta = await prisma.gaceta.findUnique({
      where: { id },
      select: { number: true, pdfUrl: true, pdfData: true },
    });
    if (!gaceta) return { ok: false, message: "Gaceta no encontrada." };

    const updates = await prisma.legalUpdatePost.findMany({
      where: { gacetaNumber: gaceta.number },
      select: { title: true, type: true },
      orderBy: { createdAt: "asc" },
      take: 8,
    });

    // Camino gratis: ya procesamos esta Gaceta y tenemos títulos.
    const free = buildGacetaDescriptionFromUpdates(updates);
    if (free) {
      return { ok: true, description: free, source: "updates" };
    }

    const pdfBuffer = await loadGacetaPdfBuffer(gaceta.pdfUrl, gaceta.pdfData);

    try {
      const fullText = await extractPdfTextForDescription(pdfBuffer);
      const excerpt = fullText.slice(0, DESCRIPTION_FALLBACK_EXCERPT_CHARS);
      const truncatedNote =
        fullText.length > excerpt.length
          ? " (mostrado parcialmente por su extensión)"
          : "";
      const description = await askHaikuForDescription(
        `Eres un editor de contenido legal para Honduras. Este es el texto de La Gaceta N° ${gaceta.number} (diario oficial de Honduras)${truncatedNote}. Todavía no tiene un análisis legal generado, así que escribe UNA sola oración en español, natural y clara, de máximo 40 palabras, que resuma de qué trata esta edición en general (por ejemplo, qué tipo de decretos, leyes, acuerdos o avisos contiene), para mostrarla en una tarjeta pública. ${FORMAT_INSTRUCTION}

Texto de la Gaceta:
${excerpt}`
      );
      return { ok: true, description, source: "ai-text" };
    } catch (textErr) {
      // pdf-parse falla con InvalidPDFException en algunos PDFs oficiales;
      // el parser de documentos de Claude suele poder leerlos igual — pero
      // SOLO con las primeras páginas, no el PDF entero.
      console.warn(
        `[generateGacetaDescriptionAI] pdf-parse falló para ${gaceta.number}, probando document API (máx ${DESCRIPTION_PDF_MAX_PAGES} págs):`,
        textErr
      );
      const description = await describeFromPdfDocument(pdfBuffer, gaceta.number);
      return { ok: true, description, source: "ai-pdf" };
    }
  } catch (err) {
    console.error("[generateGacetaDescriptionAI]", err);
    return {
      ok: false,
      message: friendlyAiError(err),
    };
  }
}

// Tope de Gacetas por click en "Procesar ahora". Con colas de 100+ Gacetas,
// sin este tope un solo click podía consumirse el rato entero de cómputo
// procesando decenas de golpe; con esto cada click es corto, predecible en
// costo, y se puede ir dando seguimiento de a poco.
const MAX_GACETAS_PER_CLICK = 5;

/**
 * Dispara el procesamiento manual de Gacetas pendientes. Cada click
 * procesa como máximo MAX_GACETAS_PER_CLICK Gacetas.
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
