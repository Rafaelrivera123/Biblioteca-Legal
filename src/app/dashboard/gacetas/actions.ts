"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { backendClient } from "@/lib/edgestore-server";
import { processPendingGacetas } from "@/lib/gaceta-processor";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");
}

export async function createGacetas(items: { number: string; url: string }[]) {
  await requireAdmin();

  let created = 0;
  const skipped: string[] = [];

  for (const item of items) {
    const number = item.number.trim();
    if (!number || !item.url) continue;

    const existing = await prisma.gaceta.findUnique({ where: { number } });
    if (existing) {
      skipped.push(number);
      continue;
    }

    await prisma.gaceta.create({
      data: { number, pdfUrl: item.url, status: "pending" },
    });
    created += 1;
  }

  revalidatePath("/dashboard/gacetas");
  return { created, skipped };
}

export async function retryGaceta(id: string) {
  await requireAdmin();
  await prisma.gaceta.update({
    where: { id },
    data: { status: "pending", errorMessage: null },
  });
  revalidatePath("/dashboard/gacetas");
}

export async function deleteGaceta(id: string) {
  await requireAdmin();
  const gaceta = await prisma.gaceta.findUnique({ where: { id } });
  if (!gaceta) return;

  await prisma.gaceta.delete({ where: { id } });

  try {
    await backendClient.publicFiles.deleteFile({ url: gaceta.pdfUrl });
  } catch (err) {
    // El PDF puede haber sido borrado ya (ej. por la limpieza de EdgeStore);
    // no es crítico si esto falla, la fila ya se eliminó.
    console.error("No se pudo borrar el PDF de EdgeStore:", gaceta.pdfUrl, err);
  }

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
