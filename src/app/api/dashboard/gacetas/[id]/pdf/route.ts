import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const gaceta = await prisma.gaceta.findUnique({
    where: { id: params.id },
    select: { fileName: true, pdfUrl: true, pdfData: true },
  });

  if (!gaceta || (!gaceta.pdfUrl && !gaceta.pdfData)) {
    return NextResponse.json(
      { error: "El archivo ya no está disponible (probablemente ya se procesó)." },
      { status: 404 }
    );
  }

  // Gacetas subidas desde el cambio a Vercel Blob viven ahí: redirigimos en
  // vez de leer el buffer y reenviarlo nosotros, porque el response de una
  // Function tiene el mismo tope de 4.5MB que el request.
  if (gaceta.pdfUrl) {
    return NextResponse.redirect(gaceta.pdfUrl);
  }

  return new NextResponse(Buffer.from(gaceta.pdfData!), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${gaceta.fileName}"`,
    },
  });
}
