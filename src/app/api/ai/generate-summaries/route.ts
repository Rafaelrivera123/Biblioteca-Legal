import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const cronSecret = process.env.CRON_SECRET?.trim();
  const providedToken = authHeader?.replace(/^Bearer\s+/i, "").trim();
  const isManual = !!cronSecret && providedToken === cronSecret;
  return isVercelCron || isManual;
}

async function run(req: NextRequest, createBody: Record<string, unknown>) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cronSecret = process.env.CRON_SECRET?.trim();
  const origin = req.nextUrl.origin;
  const authHeaders = {
    "Content-Type": "application/json",
    ...(cronSecret
      ? { Authorization: `Bearer ${cronSecret}` }
      : { "x-vercel-cron": "1" }),
  };

  // 1) Drain finished Anthropic batches into Article.aiSummary
  const processRes = await fetch(`${origin}/api/ai/batch-process`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({}),
  });
  const processData = await processRes.json();

  // 2) Submit a new batch for articles still missing summaries
  const createRes = await fetch(`${origin}/api/ai/batch-create`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(createBody),
  });
  const createData = await createRes.json();

  return NextResponse.json(
    {
      processed: processData,
      created: createData,
    },
    { status: createRes.ok ? 200 : createRes.status }
  );
}

/** Vercel Cron sends GET */
export async function GET(req: NextRequest) {
  return run(req, {});
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return run(req, body);
}
