"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { processPendingGacetas } from "@/lib/gaceta-processor";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");
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
 */
export async function processGacetasNow() {
  await requireAdmin();
  const summary = await processPendingGacetas(250_000, MAX_GACETAS_PER_CLICK);
  revalidatePath("/dashboard/gacetas");
  revalidatePath("/dashboard/legal-updates");
  return summary;
}
