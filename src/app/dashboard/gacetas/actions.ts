"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { processPendingGacetas } from "@/lib/gaceta-processor";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");
}

/**
 * Sube una Gaceta directo a Neon (Postgres) como bytea. Se hace un archivo
 * a la vez desde el cliente (ver UploadGacetasModal) para no pegarle a los
 * límites de tamaño de body de los Server Actions con varios PDFs juntos.
 *
 * Antes esto hacía un findUnique() para revisar el número duplicado y
 * DESPUÉS el create(): dos viajes a Neon por cada archivo. Ahora se intenta
 * crear directo y, si Postgres rechaza por el número duplicado (constraint
 * único), se atrapa ese error puntual (P2002) y se devuelve el mismo
 * mensaje de antes. Un viaje menos a la base de datos por cada Gaceta que
 * subes, sin cambiar el comportamiento para el usuario.
 */
export async function createGacetaFromFile(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();

  const number = (formData.get("number") as string | null)?.trim();
  const file = formData.get("file") as File | null;

  if (!number) return { ok: false, message: "Falta el número de Gaceta." };
  if (!file) return { ok: false, message: "Falta el archivo." };

  const arrayBuffer = await file.arrayBuffer();
  const pdfData = Buffer.from(arrayBuffer);

  try {
    await prisma.gaceta.create({
      data: {
        number,
        fileName: file.name,
        pdfData,
        fileAvailable: true,
        status: "pending",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, message: `Ya existe una Gaceta con el número ${number}.` };
    }
    throw error;
  }

  revalidatePath("/dashboard/gacetas");
  return { ok: true, message: "Gaceta agregada a la cola." };
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
