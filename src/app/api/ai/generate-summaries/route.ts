import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANTHROPIC_BATCH_URL = "https://api.anthropic.com/v1/messages/batches";
const CHUNK_SIZE = 1000;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isManual = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const documentId: string | undefined = body.documentId;
  const limit: number = body.limit ?? CHUNK_SIZE;

  const articles = await prisma.article.findMany({
    where: {
      aiSummary: null,
      contentPlainText: { not: "" },
      ...(documentId
        ? { chapter: { section: { documentId } } }
        : {}),
    },
    select: {
      id: true,
      articleNumber: true,
      articleLabel: true,
      contentPlainText: true,
    },
    take: limit,
  });

  if (articles.length === 0) {
    return NextResponse.json({ message: "No hay artículos pendientes" });
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
    const err = await res.text();
    return NextResponse.json({ error: `Anthropic error: ${err}` }, { status: 500 });
  }

  const data = await res.json();
  const batchId: string = data.id;

  await prisma.batchJob.create({
    data: {
      batchId,
      status: "pending",
      totalItems: articles.length,
    },
  });

  return NextResponse.json({
    message: "Batch creado",
    batchId,
    totalItems: articles.length,
  });
}
