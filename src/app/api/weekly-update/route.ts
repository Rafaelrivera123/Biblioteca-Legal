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
          content: `Eres un asistente legal especializado en Honduras. 
          Busca en internet las actualizaciones, reformas o nuevas leyes hondureñas de los últimos 7 días.
          Busca en el Diario Oficial La Gaceta de Honduras y otras fuentes oficiales.
          Para cada actualización encontrada incluye:
          - Nombre de la ley o decreto
          - Tipo de cambio (nueva ley, reforma, derogación)
          - Resumen breve de qué cambió
          - Por qué es importante actualizarla en una biblioteca legal
          Formatea toda la respuesta final en HTML limpio con estilos inline para que se vea bien en un correo electrónico.
          Usa colores: fondo #1a1a2e, texto blanco, acentos en #4CAF50.
          Si no encuentras actualizaciones recientes, indícalo claramente en el HTML.`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Respuesta inesperada de Claude");
    }

    await resend.emails.send({
      from: "Biblioteca Legal HN <noreply@bibliotecalegalhn.com>",
      to: "rafariveras10@gmail.com",
      subject: `📋 Actualizaciones Legales Honduras - ${new Date().toLocaleDateString("es-HN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
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
                          ${new Date().toLocaleDateString("es-HN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding:30px;color:#ffffff;">
                        ${textBlock.text}
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en weekly-update:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
