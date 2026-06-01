import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        law_number: true,
        slug: true,
        updatedAt: true,
        sections: {
          select: {
            title: true,
            chapters: {
              select: {
                title: true,
                articles: {
                  select: {
                    articleNumber: true,
                    contentPlainText: true,
                  },
                  take: 10,
                },
              },
            },
          },
        },
      },
    });

    const results = [];

    for (const doc of documents) {
      try {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          tools: [
            {
              type: "web_search_20250305",
              name: "web_search",
            } as any,
          ],
          messages: [
            {
              role: "user",
              content: `Eres un experto en legislación hondureña. Fecha de hoy: ${new Date().toLocaleDateString("es-HN", { year: "numeric", month: "long", day: "numeric" })}.

Documento: ${doc.name} (${doc.law_number})
Última actualización: ${new Date(doc.updatedAt).toLocaleDateString("es-HN")}

Busca si esta ley hondureña ha tenido reformas desde esa fecha hasta hoy.

Devuelve SOLO JSON válido:
{
  "up_to_date": true | false,
  "changes": [
    {
      "article_number": 5,
      "section": "nombre sección",
      "chapter": "nombre capítulo",
      "change_description": "descripción del cambio",
      "source": "fuente"
    }
  ],
  "summary": "resumen del estado"
}`,
            },
          ],
        });

        const textBlock = message.content.find((b) => b.type === "text");
        let result = {
          id: doc.id,
          name: doc.name,
          law_number: doc.law_number,
          slug: doc.slug,
          updatedAt: doc.updatedAt,
          up_to_date: true,
          changes: [] as any[],
          summary: "No se pudo analizar",
        };

        if (textBlock && textBlock.type === "text") {
          try {
            const clean = textBlock.text.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(clean);
            result = {
              ...result,
              up_to_date: parsed.up_to_date ?? true,
              changes: parsed.changes ?? [],
              summary: parsed.summary ?? "",
            };
          } catch {
            result.summary = textBlock.text.substring(0, 300);
          }
        }

        results.push(result);
      } catch (docError) {
        results.push({
          id: doc.id,
          name: doc.name,
          law_number: doc.law_number,
          slug: doc.slug,
          updatedAt: doc.updatedAt,
          up_to_date: true,
          changes: [],
          summary: "No se pudo analizar este documento.",
        });
      }

      // Esperar 15 segundos entre cada documento para no exceder el rate limit
      await delay(15000);
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Error validando documentos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
