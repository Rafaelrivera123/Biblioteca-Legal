/**
 * Backfill legacy Gaceta rows that still store PDF bytes in Neon (pdfData)
 * to Vercel Blob. Run once with production credentials:
 *
 *   npx tsx scripts/backfill-gaceta-pdf-to-blob.ts
 */
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const prisma = new PrismaClient();

async function main() {
  const gacetas = await prisma.gaceta.findMany({
    where: {
      pdfData: { not: null },
      pdfUrl: null,
    },
    select: {
      id: true,
      number: true,
      fileName: true,
      pdfData: true,
    },
  });

  console.log(`Found ${gacetas.length} Gacetas to backfill.`);

  for (const gaceta of gacetas) {
    if (!gaceta.pdfData) continue;

    const blob = await put(
      `gacetas/backfill/${gaceta.number.replace(/,/g, "-")}.pdf`,
      Buffer.from(gaceta.pdfData),
      { access: "public", contentType: "application/pdf" }
    );

    await prisma.gaceta.update({
      where: { id: gaceta.id },
      data: { pdfUrl: blob.url, pdfData: null },
    });

    console.log(`Backfilled Gaceta ${gaceta.number} → ${blob.url}`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
