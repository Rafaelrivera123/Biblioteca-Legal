import { handleLegalChat } from "../legal-ai/route";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Backward-compatible alias for document-scoped chat. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const scopedReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({ ...body, scoped: true }),
  });
  return handleLegalChat(scopedReq);
}
