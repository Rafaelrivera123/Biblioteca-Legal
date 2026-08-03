import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const cronSecret = process.env.CRON_SECRET?.trim();
  const providedToken = authHeader?.replace(/^Bearer\s+/i, "").trim();
  const isManual = !!cronSecret && providedToken === cronSecret;

  if (!isVercelCron && !isManual) {
    return NextResponse.json(
      {
        error: "No autorizado",
        debug: {
          hasEnvSecret: !!cronSecret,
          envSecretLength: cronSecret?.length ?? 0,
          envSecretLast4: cronSecret?.slice(-4) ?? null,
          hasAuthHeader: !!authHeader,
          tokenLength: providedToken?.length ?? 0,
          tokenLast4: providedToken?.slice(-4) ?? null,
        },
      },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/batch-create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cronSecret}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
