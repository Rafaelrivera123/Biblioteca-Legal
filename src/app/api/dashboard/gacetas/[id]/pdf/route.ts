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
    select: { fileName: true, pdfData: true },
  });

  if (!gaceta || !gaceta.pdfData) {
    return NextResponse.json(
      { error: "El archivo ya no está disponible (probablemente ya se procesó)." },
      { status: 404 }
    );
  }

  return new NextResponse(Buffer.from(gaceta.pdfData), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${gaceta.fileName}"`,
    },
  });
}
