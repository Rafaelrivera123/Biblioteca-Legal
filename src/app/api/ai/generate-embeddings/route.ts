import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const OPENAI_API_URL = "https://api.openai.com/v1/embeddings";
const BATCH_SIZE = 100;

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
      dimensions: 768,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings error: ${err}`);
  }

  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    type ArticleRaw = { id: string; contentPlainText: string };
    const articles = await prisma.$queryRaw<ArticleRaw[]>`
      SELECT id, "contentPlainText"
      FROM "Article"
      WHERE embedding IS NULL
      AND "contentPlainText" != ''
      LIMIT ${BATCH_SIZE}
    `;

    if (articles.length === 0) {
      return NextResponse.json({ message: "Todos los articulos ya tienen embeddings", done: true, processed: 0 });
    }

    console.log(`[embeddings] Processing ${articles.length} articles`);

    const texts = articles.map((a) => a.contentPlainText.slice(0, 2000));
    const embeddings = await generateEmbeddings(texts);

    for (let i = 0; i < articles.length; i++) {
      const vectorStr = `[${embeddings[i].join(",")}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE "Article" SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        articles[i].id
      );
    }

    const remaining = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "Article" WHERE embedding IS NULL AND "contentPlainText" != ''
    `;

    const remainingCount = Number(remaining[0].count);
    console.log(`[embeddings] Done. Remaining: ${remainingCount}`);

    return NextResponse.json({
      processed: articles.length,
      remaining: remainingCount,
      done: remainingCount === 0,
    });
  } catch (err) {
    console.error("[embeddings] ERROR:", String(err));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
