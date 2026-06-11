import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Paso 1: buscar actualizaciones legales con OpenAI web search
    const searchRes = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-search-preview",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Busca en internet las actualizaciones, reformas o nuevas leyes hondureñas de los últimos 7 días.
Busca en el Diario Oficial La Gaceta de Honduras y otras fuentes oficiales.
Devuelve SOLO un JSON valido con este formato, sin texto adicional:
{
  "updates": [
    {
      "law_name": "nombre exacto de la ley",
      "law_number": "numero del decreto o ley si existe",
      "change_type": "reforma | nueva_ley | derogacion",
      "summary": "resumen de los cambios",
      "affected_articles": ["articulo 5", "articulo 12"]
    }
  ]
}
Si no hay actualizaciones, devuelve: { "updates": [] }`,
          },
        ],
      }),
    });

    let updates: any[] = [];

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const searchText = searchData.choices?.[0]?.message?.content?.trim() ?? "";
      try {
        const clean = searchText.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        updates = parsed.updates || [];
      } catch {
        updates = [];
      }
    }

    // Paso 2: obtener solo nombres y numeros de ley
    const documents = await prisma.document.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        law_number: true,
        slug: true,
      },
    });

    // Paso 3: comparar y analizar con OpenAI
    const compareRes = await fetch(OPENAI_API_URL, {
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
            content: `Tengo estas actualizaciones legales recientes encontradas en internet:
${JSON.stringify(updates, null, 2)}

Y estos son los documentos que tengo en mi biblioteca legal:
${JSON.stringify(documents.map((d) => ({ id: d.id, name: d.name, law_number: d.law_number, slug: d.slug })), null, 2)}

Analiza y dime exactamente:
1. Que documentos de mi biblioteca necesitan actualizarse y por que
2. Que articulos especificos dentro de cada documento cambiaron
3. Que leyes nuevas deberia agregar que aun no tengo
4. Que leyes fueron derogadas y deberia marcar o eliminar

Formatea tu respuesta en HTML limpio con estilos inline, con colores: fondo #1a1a2e, texto blanco, acentos en #4CAF50.
Se muy especifico con los numeros de articulos y secciones.
Si ningun documento de mi biblioteca se ve afectado, indicalo claramente.`,
          },
        ],
      }),
    });

    if (!compareRes.ok) {
      const errText = await compareRes.text();
      throw new Error(`OpenAI error: ${errText}`);
    }

    const compareData = await compareRes.json();
    const analysisHtml = compareData.choices?.[0]?.message?.content?.trim() ?? "";

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

    return NextResponse.json({ success: true, updates_found: updates.length });
  } catch (error) {
    console.error("Error en weekly-update:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
