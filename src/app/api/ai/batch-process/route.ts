import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANTHROPIC_BATCH_URL = "https://api.anthropic.com/v1/messages/batches";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isManual = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const batchId: string | undefined = body.batchId;

  if (!batchId) {
    return NextResponse.json({ error: "batchId requerido" }, { status: 400 });
  }

  const statusRes = await fetch(`${ANTHROPIC_BATCH_URL}/${batchId}`, {
    headers: {
      "x-api-key": `${process.env.ANTHROPIC_API_KEY}`,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "message-batches-2024-09-24",
    },
  });

  if (!statusRes.ok) {
    const err = await statusRes.text();
    return NextResponse.json({ error: `Anthropic error: ${err}` }, { status: 500 });
  }

  const statusData = await statusRes.json();

  if (statusData.processing_status !== "ended") {
    return NextResponse.json({
      message: "Batch aún en proceso",
      status: statusData.processing_status,
      requestCounts: statusData.request_counts,
    });
  }

  const resultsRes = await fetch(`${ANTHROPIC_BATCH_URL}/${batchId}/results`, {
    headers: {
      "x-api-key": `${process.env.ANTHROPIC_API_KEY}`,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "message-batches-2024-09-24",
    },
  });

  if (!resultsRes.ok) {
    const err = await resultsRes.text();
    return NextResponse.json({ error: `Anthropic error: ${err}` }, { status: 500 });
  }

  const rawText = await resultsRes.text();
  const lines = rawText.trim().split("\n").filter(Boolean);

  let saved = 0;
  let failed = 0;

  for (const line of lines) {
    try {
      const result = JSON.parse(line);
      const articleId: string = result.custom_id;
      const summary: string | undefined =
        result.result?.message?.content?.[0]?.text?.trim();

      if (summary) {
        await prisma.article.update({
          where: { id: articleId },
          data: { aiSummary: summary },
        });
        saved++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  await prisma.batchJob.update({
    where: { batchId },
    data: {
      status: "completed",
      processed: saved,
      failed,
    },
  });

  return NextResponse.json({
    message: "Batch procesado",
    saved,
    failed,
    total: lines.length,
  });
}
