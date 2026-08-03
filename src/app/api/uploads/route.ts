import { auth } from "@/auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

type UploadKind = "avatar" | "legal-update-pdf";

const ALLOWED_TYPES: Record<UploadKind, string[]> = {
  avatar: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  "legal-update-pdf": ["application/pdf"],
};

function parseKind(clientPayload: string | null): UploadKind {
  if (!clientPayload) return "avatar";
  try {
    const parsed = JSON.parse(clientPayload) as { kind?: UploadKind };
    return parsed.kind === "legal-update-pdf" ? "legal-update-pdf" : "avatar";
  } catch {
    return "avatar";
  }
}

/**
 * Generic browser → Vercel Blob upload (avatars, temp legal-update PDFs).
 * Gaceta PDFs use /api/gacetas/upload.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await auth();
        if (!session?.user) {
          throw new Error("No autorizado");
        }

        const kind = parseKind(clientPayload);

        if (kind === "legal-update-pdf" && session.user.role !== "admin") {
          throw new Error("No autorizado");
        }

        const allowed = ALLOWED_TYPES[kind];
        const prefix =
          kind === "legal-update-pdf" ? "legal-updates/tmp" : "avatars";

        return {
          allowedContentTypes: allowed,
          addRandomSuffix: true,
          pathname: `${prefix}/${pathname}`,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("[uploads] Blob subido:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
