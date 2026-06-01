import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Paso 1: buscar actualizaciones legales en internet
    const searchMessage = await anthropic.messages.create({
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
          content: `Busca en internet las actualizaciones, reformas o nuevas leyes hondureñas de los últimos 7 días.
          Busca en el Diario Oficial La Gaceta de Honduras y otras fuentes oficiales.
          Devuelve SOLO un JSON válido con este formato, sin texto adicional:
          {
            "updates": [
              {
                "law_name": "nombre exacto de la ley",
                "law_number": "número del decreto o ley si existe",
                "change_type": "reforma | nueva_ley | derogación",
                "summary": "resumen de los cambios",
                "affected_articles": ["artículo 5", "artículo 12"]
              }
            ]
          }
          Si no hay actualizaciones, devuelve: { "updates": [] }`,
        },
      ],
    });

    const searchTextBlock = searchMessage.content.find(
      (block) => block.type === "text"
    );
    if (!searchTextBlock || searchTextBlock.type !== "text") {
      throw new Error("Respuesta inesperada de Claude en búsqueda");
    }

    let updates: any[] = [];
    try {
      const clean = searchTextBlock.text
        .replace(/```json|```/g, "")
        .trim();
      const parsed = JSON.parse(clean);
      updates = parsed.updates || [];
    } catch {
      updates = [];
    }

    // Paso 2: obtener todos los documentos de la BD
    const documents = await prisma.document.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        law_number: true,
        slug: true,
        sections: {
          select: {
            id: true,
            title: true,
            chapters: {
              select: {
                id: true,
                title: true,
                articles: {
                  select: {
                    id: true,
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

    // Paso 3: comparar actualizaciones con documentos en BD
    const compareMessage = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Eres un asistente legal especializado en Honduras.
          
          Tengo estas actualizaciones legales recientes encontradas en internet:
          ${JSON.stringify(updates, null, 2)}
          
          Y estos son los documentos que actualmente tengo en mi biblioteca legal:
          ${JSON.stringify(
            documents.map((doc) => ({
              id: doc.id,
              name: doc.name,
              law_number: doc.law_number,
              slug: doc.slug,
              sections: doc.sections.map((s) => ({
                title: s.title,
                chapters: s.chapters.map((c) => ({
                  title: c.title,
                  articles: c.articles.map((a) => ({
                    articleNumber: a.articleNumber,
                    content: a.contentPlainText.substring(0, 300),
                  })),
                })),
              })),
            })),
            null,
            2
          )}
          
          Analiza y dime exactamente:
          1. Qué documentos de mi biblioteca necesitan actualizarse y por qué
          2. Qué artículos específicos dentro de cada documento cambiaron
          3. Qué leyes nuevas debería agregar que aún no tengo
          4. Qué leyes fueron derogadas y debería marcar o eliminar
          
          Formatea tu respuesta en HTML limpio con estilos inline, con colores: fondo #1a1a2e, texto blanco, acentos en #4CAF50.
          Sé muy específico con los números de artículos y secciones.
          Si ningún documento de mi biblioteca se ve afectado, indícalo claramente.`,
        },
      ],
    });

    const compareTextBlock = compareMessage.content.find(
      (block) => block.type === "text"
    );
    if (!compareTextBlock || compareTextBlock.type !== "text") {
      throw new Error("Respuesta inesperada de Claude en comparación");
    }

    await resend.emails.send({
      from: "Biblioteca Legal HN <noreply@bibliotecalegalhn.com>",
      to: "rafariveras10@gmail.com",
      subject: `📋 Actualizaciones Legales Honduras - ${new Date().toLocaleDateString(
        "es-HN",
        { weekday: "long", year: "numeric", month: "long", day: "numeric" }
      )}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;border-radius:12px;overflow:hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background-color:#0f3460;padding:30px;text-align:center;">
                        <h1 style="color:#4CAF50;margin:0;font-size:24px;">📚 Biblioteca Legal HN</h1>
                        <p style="color:#ffffff;margin:8px 0 0;font-size:14px;">Reporte Semanal de Actualizaciones Legales</p>
                        <p style="color:#aaaaaa;margin:4px 0 0;font-size:12px;">
                          ${new Date().toLocaleDateString("es-HN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding:30px;color:#ffffff;">
                        ${compareTextBlock.text}
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color:#0f3460;padding:20px;text-align:center;">
                        <p style="color:#aaaaaa;margin:0;font-size:12px;">
                          Este correo fue generado automáticamente por Biblioteca Legal HN
                        </p>
                        <a href="https://www.bibliotecalegalhn.com" style="color:#4CAF50;font-size:12px;">
                          www.bibliotecalegalhn.com
                        </a>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true, updates_found: updates.length });
  } catch (error) {
    console.error("Error en weekly-update:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
