import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const BATCH_SIZE = 40;
const PARALLEL_SIZE = 10;

async function generateSummary(articleText: string, articleLabel: string): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Eres un asistente legal hondureño. Resume el siguiente artículo de ley en 2-3 oraciones claras y simples, en español, para que un estudiante de derecho pueda entender rápidamente su contenido. No uses viñetas. Solo devuelve el resumen, sin introducción ni frases como "Este artículo dice".

Artículo ${articleLabel}:
${articleText}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
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

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const isManual = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const documentId: string | undefined = body.documentId;

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
    take: BATCH_SIZE,
  });

  if (articles.length === 0) {
    return NextResponse.json({ message: "No hay artículos pendientes", generated: 0 });
  }

  let generated = 0;
  let failed = 0;

  // Procesar en grupos paralelos de PARALLEL_SIZE
  for (let i = 0; i < articles.length; i += PARALLEL_SIZE) {
    const chunk = articles.slice(i, i + PARALLEL_SIZE);
    const results = await Promise.all(chunk.map(processArticle));
    results.forEach((r) => {
      if (r.success) generated++;
      else failed++;
    });
  }

  return NextResponse.json({
    message: "Proceso completado",
    generated,
    failed,
    pending: articles.length - generated - failed,
  });
}
