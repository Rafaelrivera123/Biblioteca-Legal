import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const BATCH_SIZE = 30;
const PARALLEL_SIZE = 3;

async function generateSummary(articleText: string, articleLabel: string): Promise<string> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": `${process.env.ANTHROPIC_API_KEY}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Eres un asistente legal hondureño. Resume el siguiente artículo de ley en 2-3 oraciones claras y simples, en español, para que un estudiante de derecho pueda entender rápidamente su contenido. No uses viñetas. Solo devuelve el resumen, sin introducción ni frases como "Este artículo dice".

Artículo ${articleLabel}:
${articleText}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text?.trim() ?? "";
}

async function processArticle(article: {
  id: string;
  articleNumber: number;
  articleLabel: string | null;
  contentPlainText: string;
}): Promise<{ success: boolean }> {
  try {
    const label = article.articleLabel ?? String(article.articleNumber);
    const summary = await generateSummary(article.contentPlainText, label);
    if (summary) {
      await prisma.article.update({
        where: { id: article.id },
        data: { aiSummary: summary },
      });
      return { success: true };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

type ArticleRaw = {
  id: string;
  articleNumber: number;
  articleLabel: string | null;
  contentPlainText: string;
};

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isManual = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  console.log("authHeader recibido:", authHeader);
  console.log("CRON_SECRET en env:", process.env.CRON_SECRET);
  console.log("isManual:", isManual);

  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const documentId: string | undefined = body.documentId;

  const articles: ArticleRaw[] = documentId
    ? await prisma.article.findMany({
        where: {
          aiSummary: null,
          contentPlainText: { not: "" },
          chapter: { section: { documentId } },
        },
        select: {
          id: true,
          articleNumber: true,
          articleLabel: true,
          contentPlainText: true,
        },
        take: BATCH_SIZE,
      })
    : await prisma.$queryRaw<ArticleRaw[]>`
        SELECT a.id, a."articleNumber", a."articleLabel", a."contentPlainText"
        FROM "Article" a
        JOIN "Chapter" c ON a."chapterId" = c.id
        JOIN "Section" s ON c."sectionId" = s.id
        JOIN "Document" d ON s."documentId" = d.id
        WHERE a."aiSummary" IS NULL
        AND a."contentPlainText" != ''
        ORDER BY d."viewCount" DESC
        LIMIT ${BATCH_SIZE}
      `;

  if (articles.length === 0) {
    return NextResponse.json({ message: "No hay artículos pendientes", generated: 0 });
  }

  let generated = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i += PARALLEL_SIZE) {
    const chunk = articles.slice(i, i + PARALLEL_SIZE);
    const results = await Promise.all(chunk.map(processArticle));
    results.forEach((r) => {
      if (r.success) generated++;
      else failed++;
    });
    if (i + PARALLEL_SIZE < articles.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return NextResponse.json({
    message: "Proceso completado",
    generated,
    failed,
    pending: articles.length - generated - failed,
  });
}
