import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const TAVILY_API_URL = "https://api.tavily.com/search";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Paso 1: buscar actualizaciones legales con Tavily
    const tavilyRes = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: "reformas leyes Honduras Gaceta Oficial decretos legislativos 2026",
        search_depth: "advanced",
        max_results: 10,
        include_answer: true,
        days: 7,
      }),
    });

    if (!tavilyRes.ok) {
      throw new Error(`Tavily error: ${await tavilyRes.text()}`);
    }

    const tavilyData = await tavilyRes.json();
    const searchResults = tavilyData.results ?? [];
    const searchAnswer = tavilyData.answer ?? "";

    // Paso 2: obtener documentos de la BD (solo nombres y numeros)
    const documents = await prisma.document.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        law_number: true,
        slug: true,
      },
    });

    // Paso 3: analizar con OpenAI
    const openaiRes = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 4096,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: "Eres un asistente legal especializado en Honduras. Respondes en HTML con estilos inline.",
          },
          {
            role: "user",
            content: `Estas son las noticias y actualizaciones legales de Honduras de los ultimos 7 dias encontradas en internet:

RESUMEN: ${searchAnswer}

FUENTES:
${searchResults.map((r: any) => `- ${r.title}: ${r.content}`).join("\n")}

Estos son los documentos que tengo en mi biblioteca legal:
${JSON.stringify(documents.map((d) => ({ name: d.name, law_number: d.law_number })), null, 2)}

Analiza y dime:
1. Que documentos de mi biblioteca necesitan actualizarse y por que
2. Que articulos especificos cambiaron
3. Que leyes nuevas deberia agregar
4. Que leyes fueron derogadas

Formatea tu respuesta en HTML limpio con estilos inline. Usa fondo #1a1a2e, texto blanco, acentos en #4CAF50.
Si ningun documento se ve afectado, indicalo claramente.`,
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      throw new Error(`OpenAI error: ${await openaiRes.text()}`);
    }

    const openaiData = await openaiRes.json();
    const analysisHtml = openaiData.choices?.[0]?.message?.content?.trim() ?? "";

    if (!analysisHtml) {
      throw new Error("Respuesta vacia de OpenAI");
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
                    <tr>
                      <td style="padding:30px;color:#ffffff;">
                        ${analysisHtml}
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color:#0f3460;padding:20px;text-align:center;">
                        <p style="color:#aaaaaa;margin:0;font-size:12px;">
                          Este correo fue generado automaticamente por Biblioteca Legal HN
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

    return NextResponse.json({ success: true, results_found: searchResults.length });
  } catch (error) {
    console.error("Error en weekly-update:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
