import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ANTHROPIC_BATCH_URL = "https://api.anthropic.com/v1/messages/batches";

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const cronSecret = process.env.CRON_SECRET?.trim();
  const providedToken = authHeader?.replace(/^Bearer\s+/i, "").trim();
  const isManual = !!cronSecret && providedToken === cronSecret;
  return isVercelCron || isManual;
}

async function processBatch(batchId: string) {
  const statusRes = await fetch(`${ANTHROPIC_BATCH_URL}/${batchId}`, {
    headers: {
      "x-api-key": `${process.env.ANTHROPIC_API_KEY}`,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "message-batches-2024-09-24",
    },
  });

  if (!statusRes.ok) {
    const err = await statusRes.text();
    if (statusRes.status === 404) {
      await prisma.batchJob.update({
        where: { batchId },
        data: { status: "failed", failed: 0 },
      });
      return {
        batchId,
        message: "Batch no encontrado en Anthropic",
        status: "not_found",
        saved: 0,
        failed: 0,
      };
    }
    throw new Error(`Anthropic error: ${err}`);
  }

  const statusData = await statusRes.json();

  if (statusData.processing_status !== "ended") {
    return {
      batchId,
      message: "Batch aún en proceso",
      status: statusData.processing_status,
      requestCounts: statusData.request_counts,
      saved: 0,
      failed: 0,
    };
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
    throw new Error(`Anthropic error: ${err}`);
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

  return {
    batchId,
    message: "Batch procesado",
    status: "ended",
    saved,
    failed,
    total: lines.length,
  };
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const batchId: string | undefined = body.batchId;

  try {
    if (batchId) {
      const result = await processBatch(batchId);
      return NextResponse.json(result);
    }

    const pending = await prisma.batchJob.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
    });

    if (pending.length === 0) {
      return NextResponse.json({
        message: "No hay batches pendientes",
        results: [],
      });
    }

    const results = [];
    for (const job of pending) {
      results.push(await processBatch(job.batchId));
    }

    const saved = results.reduce((sum, r) => sum + (r.saved ?? 0), 0);
    const stillPending = results.filter(
      (r) => r.status && r.status !== "ended" && r.status !== "not_found"
    ).length;

    return NextResponse.json({
      message: "Batches revisados",
      processedBatches: results.length,
      saved,
      stillPending,
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
