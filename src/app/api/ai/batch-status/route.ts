import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANTHROPIC_BATCH_URL = "https://api.anthropic.com/v1/messages/batches";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isManual = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isManual) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");

  if (!batchId) {
    return NextResponse.json({ error: "batchId requerido" }, { status: 400 });
  }

  const res = await fetch(`${ANTHROPIC_BATCH_URL}/${batchId}`, {
    headers: {
      "x-api-key": `${process.env.ANTHROPIC_API_KEY}`,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "message-batches-2024-09-24",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Anthropic error: ${err}` }, { status: 500 });
  }

  const data = await res.json();

  return NextResponse.json({
    batchId,
    status: data.processing_status,
    requestCounts: data.request_counts,
  });
}
