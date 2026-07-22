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
 * Sube una Gaceta directo a Neon (Postgres) como bytea. Se hace un archivo
 * a la vez desde el cliente (ver UploadGacetasModal) para no pegarle a los
 * límites de tamaño de body de los Server Actions con varios PDFs juntos.
 *
 * Todo el cuerpo (después de validar admin) va envuelto en try/catch: con
 * lotes de 100+ Gacetas, un solo archivo con problema (PDF corrupto, blip
 * de conexión a Neon, número duplicado) no debe tumbar el Server Action
 * entero con un error opaco — siempre devolvemos { ok, message } para que
 * el cliente pueda seguir con el resto de la cola.
 */
export async function createGacetaFromFile(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();

  try {
    const number = (formData.get("number") as string | null)?.trim();
    const file = formData.get("file") as File | null;

    if (!number) return { ok: false, message: "Falta el número de Gaceta." };
    if (!file) return { ok: false, message: "Falta el archivo." };

    const existing = await prisma.gaceta.findUnique({ where: { number } });
    if (existing) {
      return { ok: false, message: `Ya existe una Gaceta con el número ${number}.` };
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfData = Buffer.from(arrayBuffer);

    await prisma.gaceta.create({
      data: {
        number,
        fileName: file.name,
        pdfData,
        fileAvailable: true,
        status: "pending",
      },
    });

    revalidatePath("/dashboard/gacetas");
    return { ok: true, message: "Gaceta agregada a la cola." };
  } catch (error) {
    console.error("Error subiendo Gaceta:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Error inesperado al subir el archivo.",
    };
  }
}

export async function retryGaceta(id: string) {
  await requireAdmin();
  const gaceta = await prisma.gaceta.findUnique({ where: { id } });
  if (!gaceta) throw new Error("Gaceta no encontrada.");
  if (!gaceta.pdfData) {
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
 * Dispara el mismo procesamiento que corre el cron, pero al toque, para que
 * el admin no tenga que esperar al próximo horario programado para probar
 * que una Gaceta recién subida se procesa bien.
 */
export async function processGacetasNow() {
  await requireAdmin();
  const summary = await processPendingGacetas(250_000);
  revalidatePath("/dashboard/gacetas");
  revalidatePath("/dashboard/legal-updates");
  return summary;
}
