import { auth } from "@/auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * Autoriza y confirma subidas de PDFs de La Gaceta directo del navegador a
 * Vercel Blob (ver UploadGacetasModal). El archivo binario nunca pasa por
 * esta función ni por ningún Server Action — solo se intercambia un token
 * acá — así se evita el límite duro de Vercel de 4.5MB por request/response
 * de una Function, que antes hacía fallar la subida de cualquier Gaceta
 * pesada sin importar qué tan alto estuviera `bodySizeLimit` en
 * next.config.mjs.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (session?.user?.role !== "admin") {
          throw new Error("No autorizado");
        }
        return {
          allowedContentTypes: ["application/pdf"],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("[gacetas/upload] Blob subido:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // Vercel reintenta 5 veces si no recibe un 200
    );
  }
}
