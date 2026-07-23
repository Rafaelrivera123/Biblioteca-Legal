import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Ruta pública (sin auth) para ver/descargar el PDF original de una Gaceta.
 * A diferencia de /api/dashboard/gacetas/[id]/pdf (solo admin), esta se linkea
 * desde la página pública /gacetas para que cualquier visitante pueda
 * consultar el documento oficial. Si pdfData ya fue liberado (ver comentario
 * en el modelo Gaceta, prisma/schema.prisma) devuelve 404 con un mensaje
 * explicando dónde encontrar el análisis del contenido de esa Gaceta.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const gaceta = await prisma.gaceta.findUnique({
    where: { id: params.id },
    select: { fileName: true, pdfData: true, fileAvailable: true },
  });

  if (!gaceta || !gaceta.pdfData || !gaceta.fileAvailable) {
    return NextResponse.json(
      {
        error:
          "El PDF original de esta Gaceta ya no está disponible. Puedes consultar el análisis de sus reformas en /actualizaciones.",
      },
      { status: 404 }
    );
  }

  return new NextResponse(Buffer.from(gaceta.pdfData), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${gaceta.fileName}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
