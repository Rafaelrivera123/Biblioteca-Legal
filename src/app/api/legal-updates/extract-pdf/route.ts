import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  try {
    const cu = await auth();
    if (!cu || cu.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Archivo no proporcionado" }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // pdf-parse exporta una función default que recibe un Buffer
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    const text = data.text?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ error: "No se pudo extraer texto del PDF" }, { status: 400 });
    }
    return NextResponse.json({ success: true, text });
  } catch (err) {
    console.error("[extract-pdf] ERROR:", String(err));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
