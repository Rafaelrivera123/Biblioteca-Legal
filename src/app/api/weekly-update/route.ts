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
    // Paso 1: Buscar actualizaciones legales con Tavily (Query mejorada para capturar números de Gaceta y artículos)
    const tavilyRes = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: "reformas leyes Honduras 'La Gaceta' decretos articulos modificados 2026",
        search_depth: "advanced",
        max_results: 15, // Incrementado para obtener más contexto y fuentes detalladas
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

    // Paso 2: Obtener documentos de la BD
    const documents = await prisma.document.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        law_number: true,
        slug: true,
      },
    });

    // Paso 3: Analizar con OpenAI empleando un prompt de alta precisión estructural
    const openaiRes = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 4096,
        temperature: 0.1, // Temperatura baja para evitar alucinaciones en textos legales
        messages: [
          {
            role: "system",
            content: `Eres un asistente legal experto en el marco jurídico de Honduras y auditor legislativo de alta precisión. 
            Tu trabajo es contrastar noticias de reformas con la biblioteca legal actual. 
            Debes responder exclusivamente en HTML limpio usando estilos inline. 
            Usa fondo #1a1a2e, texto blanco y acentos en #4CAF50 para los contenedores principales.`,
          },
          {
            role: "user",
            content: `Analiza de forma rigurosa la siguiente información recopilada en los últimos 7 días sobre reformas legales en Honduras:

NOTICIAS Y RESUMEN DE INTERNET:
${searchAnswer}

FUENTES DETALLADAS:
${searchResults.map((r: any) => `- [${r.title}]: ${r.content}`).join("\n")}

ESTA ES MI BIBLIOTECA LEGAL ACTUAL (Documentos disponibles):
${JSON.stringify(documents.map((d) => ({ name: d.name, law_number: d.law_number })), null, 2)}

Genera un reporte detallado estructurado estrictamente bajo los siguientes puntos (si un punto no tiene datos, indica "No se detectaron cambios"):

1. ⚠️ DOCUMENTOS DE LA BIBLIOTECA AFECTADOS:
Para cada documento de mi biblioteca que sufra variaciones, detalla de forma obligatoria:
- **Ley/Documento Afectado** (Indica el nombre y número de ley).
- **Sustento del Cambio**: En base a qué se realiza (ej. Decreto No. XX-2026, Resolución XX).
- **Fecha de Publicación en La Gaceta**: (Indica la fecha exacta o aproximada provista por las fuentes).
- **Desglose de Artículos Modificados**: Crea una tabla o un bloque visual claro para cada artículo afectado que muestre:
   • **Artículo número**: [Número]
   • **[ANTES] Texto anterior / Estado previo**: (Lo que se infiere o reporta que cambia).
   • **[DESPUÉS] Texto nuevo / Texto reformado**: (La nueva disposición legal vigente).

2. ➕ NUEVAS LEYES A AGREGAR:
Leyes, decretos o reglamentos nuevos publicados en La Gaceta que no están en mi biblioteca pero que deberían incorporarse (especifica Nombre, Decreto, Fecha en La Gaceta y un breve resumen).

3. ❌ LEYES DEROGADAS:
Documentos de mi biblioteca que quedan sin vigencia total, indicando mediante qué nuevo Decreto se derogan y su fecha de publicación.

Exigencias de Formato:
- Sé directo, formal y sumamente meticuloso. No inventes artículos si la fuente no los cita explícitamente, pero extrae hasta el último detalle de los textos provistos.
- Utiliza etiquetas HTML claras (\`<h3>\`, \`<p>\`, \`<ul>\`, o estructuras de bloques con bordes de color #4CAF50 para separar visualmente el "Antes" y el "Después").`,
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

    // Paso 4: Enviar el correo electrónico
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
                  <table width="650" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;border-radius:12px;overflow:hidden;">
                    <tr>
                      <td style="background-color:#0f3460;padding:30px;text-align:center;">
                        <h1 style="color:#4CAF50;margin:0;font-size:24px;">📚 Biblioteca Legal HN</h1>
                        <p style="color:#ffffff;margin:8px 0 0;font-size:14px;">Reporte Crítico de Actualizaciones y Reformas</p>
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
                      <td style="padding:30px;color:#ffffff;line-height:1.6;font-size:15px;">
                        ${analysisHtml}
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color:#0f3460;padding:20px;text-align:center;">
                        <p style="color:#aaaaaa;margin:0;font-size:12px;">
                          Este correo fue generado automáticamente por el sistema de auditoría de Biblioteca Legal HN.
                        </p>
                        <a href="https://www.bibliotecalegalhn.com" style="color:#4CAF50;font-size:12px;text-decoration:none;font-weight:bold;">
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
