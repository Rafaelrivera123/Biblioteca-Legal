import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Sirve el PDF de una Gaceta a CUALQUIER visitante (a diferencia de
 * /api/dashboard/gacetas/[id]/pdf, que es solo para admin). Las Gacetas
 * Oficiales son documentos públicos, así que esta ruta no valida sesión.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const gaceta = await prisma.gaceta.findUnique({
    where: { id: params.id },
    select: { fileName: true, pdfData: true, fileAvailable: true },
  });

  if (!gaceta || !gaceta.fileAvailable || !gaceta.pdfData) {
    return NextResponse.json(
      { error: "Este PDF no está disponible." },
      { status: 404 }
    );
  }

  return new NextResponse(Buffer.from(gaceta.pdfData), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${gaceta.fileName}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
