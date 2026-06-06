import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

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

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
    take: 50,
  });

  if (articles.length === 0) {
    return NextResponse.json({ message: "No hay artículos pendientes", generated: 0 });
  }

  let generated = 0;
  let failed = 0;

  for (const article of articles) {
    try {
      const label = article.articleLabel ?? String(article.articleNumber);
      const summary = await generateSummary(article.contentPlainText, label);

      if (summary) {
        await prisma.article.update({
          where: { id: article.id },
          data: { aiSummary: summary },
        });
        generated++;
      }

      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`Error en artículo ${article.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({
    message: "Proceso completado",
    generated,
    failed,
    pending: articles.length - generated - failed,
  });
}
