import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
                },
              },
            },
          },
        },
      },
    });

    const results = [];

    for (const doc of documents) {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
          } as any,
        ],
        messages: [
          {
            role: "user",
            content: `Eres un experto en legislación hondureña. La fecha de hoy es ${new Date().toLocaleDateString("es-HN", { year: "numeric", month: "long", day: "numeric" })}.

Tengo este documento en mi biblioteca legal:
- Nombre: ${doc.name}
- Número de ley: ${doc.law_number}
- Última actualización en mi sistema: ${new Date(doc.updatedAt).toLocaleDateString("es-HN")}

Contenido actual:
${JSON.stringify(
  doc.sections.map((s) => ({
    seccion: s.title,
    capitulos: s.chapters.map((c) => ({
      capitulo: c.title,
      articulos: c.articles.map((a) => ({
        numero: a.articleNumber,
        contenido: a.contentPlainText.substring(0, 500),
      })),
    })),
  })),
  null,
  2
)}

Busca en internet si esta ley ha tenido reformas, modificaciones o actualizaciones desde la fecha de última actualización en mi sistema hasta hoy.

Devuelve SOLO un JSON válido con este formato exacto, sin texto adicional:
{
  "up_to_date": true | false,
  "changes": [
    {
      "article_number": 5,
      "section": "nombre de la sección",
      "chapter": "nombre del capítulo",
      "change_description": "descripción exacta del cambio que se debe hacer",
      "source": "fuente donde encontraste el cambio"
    }
  ],
  "summary": "resumen general del estado del documento"
}

Si está al día devuelve up_to_date: true y changes: [].`,
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
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Error validando documentos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
