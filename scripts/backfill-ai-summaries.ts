/**
 * Backfill Article.aiSummary for every article with non-empty contentPlainText.
 *
 * Uses Anthropic Message Batches (same pipeline as /api/ai/*).
 *
 *   npx tsx --env-file=.env.local scripts/backfill-ai-summaries.ts
 *
 * Options:
 *   --create-only   Only submit new batches (do not poll/process)
 *   --process-only  Only drain pending BatchJobs
 *   --limit=N       Max articles per create call (default 1000)
 *   --max-batches=N Stop after creating N new batches (default unlimited)
 *   --poll-ms=N     Poll interval while waiting (default 30000)
 */
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

function loadEnvLocal() {
  try {
    const text = readFileSync(".env.local", "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // rely on process env when .env.local is absent
  }
}

loadEnvLocal();

const prisma = new PrismaClient();

const ANTHROPIC_BATCH_URL = "https://api.anthropic.com/v1/messages/batches";
const CHUNK_SIZE = 1000;

function parseArgs() {
  const args = process.argv.slice(2);
  const getNum = (name: string, fallback: number) => {
    const hit = args.find((a) => a.startsWith(`${name}=`));
    return hit ? Number(hit.split("=")[1]) : fallback;
  };
  return {
    createOnly: args.includes("--create-only"),
    processOnly: args.includes("--process-only"),
    limit: getNum("--limit", CHUNK_SIZE),
    maxBatches: getNum("--max-batches", Number.POSITIVE_INFINITY),
    pollMs: getNum("--poll-ms", 30_000),
  };
}

async function countMissing() {
  return prisma.article.count({
    where: { aiSummary: null, contentPlainText: { not: "" } },
  });
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
        data: { status: "failed" },
      });
      console.log(`  ✗ ${batchId}: not found on Anthropic → marked failed`);
      return { done: true, saved: 0 };
    }
    throw new Error(`Anthropic status error: ${err}`);
  }

  const statusData = await statusRes.json();
  if (statusData.processing_status !== "ended") {
    console.log(
      `  … ${batchId}: ${statusData.processing_status}`,
      statusData.request_counts ?? ""
    );
    return { done: false, saved: 0 };
  }

  const resultsRes = await fetch(`${ANTHROPIC_BATCH_URL}/${batchId}/results`, {
    headers: {
      "x-api-key": `${process.env.ANTHROPIC_API_KEY}`,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "message-batches-2024-09-24",
    },
  });

  if (!resultsRes.ok) {
    throw new Error(`Anthropic results error: ${await resultsRes.text()}`);
  }

  const lines = (await resultsRes.text()).trim().split("\n").filter(Boolean);
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
    data: { status: "completed", processed: saved, failed },
  });

  console.log(`  ✓ ${batchId}: saved=${saved} failed=${failed}`);
  return { done: true, saved };
}

async function drainPending() {
  const pending = await prisma.batchJob.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) {
    console.log("No pending BatchJobs.");
    return { allDone: true, saved: 0 };
  }

  console.log(`Draining ${pending.length} pending BatchJob(s)...`);
  let saved = 0;
  let allDone = true;

  for (const job of pending) {
    const result = await processBatch(job.batchId);
    saved += result.saved;
    if (!result.done) allDone = false;
  }

  return { allDone, saved };
}

async function createBatch(limit: number) {
  const articles = await prisma.article.findMany({
    where: { aiSummary: null, contentPlainText: { not: "" } },
    select: {
      id: true,
      articleNumber: true,
      articleLabel: true,
      contentPlainText: true,
    },
    take: limit,
  });

  if (articles.length === 0) {
    return null;
  }

  const requests = articles.map((article) => {
    const label = article.articleLabel ?? String(article.articleNumber);
    return {
      custom_id: article.id,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Eres un asistente legal hondureño. Resume el siguiente artículo de ley en 2-3 oraciones claras y simples, en español, para que un estudiante de derecho pueda entender rápidamente su contenido. No uses viñetas. Solo devuelve el resumen, sin introducción ni frases como "Este artículo dice".

Artículo ${label}:
${article.contentPlainText}`,
          },
        ],
      },
    };
  });

  const res = await fetch(ANTHROPIC_BATCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": `${process.env.ANTHROPIC_API_KEY}`,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "message-batches-2024-09-24",
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic create error: ${await res.text()}`);
  }

  const data = await res.json();
  await prisma.batchJob.create({
    data: {
      batchId: data.id,
      status: "pending",
      totalItems: articles.length,
    },
  });

  console.log(`Created batch ${data.id} with ${articles.length} articles`);
  return data.id as string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required");
  }

  const opts = parseArgs();
  const missingBefore = await countMissing();
  const emptyText = await prisma.article.count({
    where: { aiSummary: null, contentPlainText: "" },
  });

  console.log(
    `Missing summaries: ${missingBefore} (plus ${emptyText} with empty contentPlainText — skipped)`
  );

  if (opts.createOnly) {
    let created = 0;
    while (created < opts.maxBatches) {
      const id = await createBatch(opts.limit);
      if (!id) break;
      created++;
    }
    console.log(`Created ${created} batch(es). Run again without --create-only to process.`);
    return;
  }

  // Always drain first to avoid duplicate Anthropic spend
  let drain = await drainPending();

  if (opts.processOnly) {
    while (!drain.allDone) {
      console.log(`Waiting ${opts.pollMs}ms for in-flight batches...`);
      await sleep(opts.pollMs);
      drain = await drainPending();
    }
    console.log(`Done processing. Saved ${drain.saved}. Missing now: ${await countMissing()}`);
    return;
  }

  let created = 0;
  while (created < opts.maxBatches) {
    // Wait until previous pending jobs finish before creating more
    while (!(await drainPending()).allDone) {
      console.log(`Waiting ${opts.pollMs}ms for in-flight batches...`);
      await sleep(opts.pollMs);
    }

    const missing = await countMissing();
    if (missing === 0) break;

    const id = await createBatch(opts.limit);
    if (!id) break;
    created++;
  }

  while (!(await drainPending()).allDone) {
    console.log(`Waiting ${opts.pollMs}ms for final batches...`);
    await sleep(opts.pollMs);
  }

  const missingAfter = await countMissing();
  console.log(
    `Finished. Created ${created} batch(es). Missing before=${missingBefore} after=${missingAfter}.`
  );
  if (missingAfter > 0) {
    console.log(
      "Some articles may have failed Anthropic generation; re-run this script to retry."
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
