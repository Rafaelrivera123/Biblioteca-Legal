import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    console.log("[test] inicio");

    const cu = await auth();
    console.log("[test] auth resultado:", JSON.stringify(cu?.user ?? null));

    if (!cu?.user?.id) {
      return NextResponse.json({ error: "No autenticado", user: null }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    console.log("[test] body:", JSON.stringify(body));

    return NextResponse.json({ ok: true, userId: cu.user.id, role: cu.user.role });
  } catch (err) {
    console.error("[test] ERROR:", String(err));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
