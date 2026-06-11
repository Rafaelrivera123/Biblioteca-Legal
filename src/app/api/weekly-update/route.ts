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
    // Paso 1: Buscar actualizaciones legales con Tavily (Query especializada con operadores para forzar la captura de la Gaceta y decretos)
    const tavilyRes = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: "reformas leyes Honduras 'La Gaceta' 'decreto' 'artículo' modificados 2026",
        search_depth: "advanced",
        max_results: 15,
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

    // Paso 2: Obtener documentos vigentes de la Base de Datos
    const documents = await prisma.document.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        law_number: true,
        slug: true,
      },
    });

    // Paso 3: Análisis ultra estructurado y restrictivo con OpenAI (gpt-4o-mini)
    const openaiRes = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 4096,
        temperature: 0.0, // Temperatura a 0 absoluto para evitar la falsificación o alucinación de contenido normativo
        messages: [
          {
            role: "system",
            content: `Eres un auditor legislativo y asistente legal de élite experto en la legislación de la República de Honduras.
Tu única tarea es contrastar información del Diario Oficial 'La Gaceta' y reformas del Congreso Nacional obtenidas de internet con los documentos presentes en el catálogo del sistema.
Debes responder de forma EXCLUSIVA en HTML fragmentado limpio (sin envoltorios globales \`<html>\` ni \`<body>\`), aplicando estrictamente estilos CSS inline compatibles con clientes de correo electrónico.
Esquema de colores requerido: fondo #1a1a2e para contenedores internos, acentos en #4CAF50 y textos legibles sobre fondo oscuro.`,
          },
          {
            role: "user",
            content: `Genera un reporte técnico minucioso cruzando las siguientes fuentes de datos extraídas esta semana:

========================================
NOTICIAS Y RESUMEN LEGISLATIVO RECUPERADO:
${searchAnswer}

FUENTES DETALLADAS:
${searchResults.map((r: any) => `- [${r.title}]: ${r.content}`).join("\n")}

CATÁLOGO ACTUAL DE NUESTRA BIBLIOTECA LEGAL:
${JSON.stringify(documents.map((d) => ({ name: d.name, law_number: d.law_number })), null, 2)}
========================================

Estructura el cuerpo del reporte siguiendo rigurosamente las siguientes secciones HTML. Si en una sección no se localizan datos fidedignos en las fuentes, añade un párrafo indicando explícitamente: "No se identificaron novedades en este apartado basado en los reportes de los últimos 7 días".

### SECCIONES A DESARROLLAR:

1. <h2 style="color:#4CAF50; font-size:18px; border-bottom:1px solid #4CAF50; padding-bottom:5px; margin-top:20px;">⚠️ REFORMAS Y MODIFICACIONES DETECTADAS</h2>
Identifica qué leyes de nuestra biblioteca han sufrido cambios. Por cada ley afectada, debes listar obligatoriamente:
- <p><strong>Ley Afectada:</strong> [Nombre y número asignado en biblioteca]</p>
- <p><strong>Sustento Jurídico del Cambio:</strong> [Número de Decreto Legislativo, Acuerdo Ejecutivo o Resolución institucional]</p>
- <p><strong>Fecha de Publicación Oficial:</strong> [Fecha exacta o mes estimado de publicación en el Diario Oficial La Gaceta]</p>
- <strong>Tabla Comparativa de Artículos:</strong> Crea una tabla HTML formateada con los siguientes estilos inline:
  \`<table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #4CAF50; margin: 15px 0; background-color: #111122; font-size: 14px; border-collapse: collapse;">\`
  Las cabeceras de la tabla (\`<th>\`) deben ser: 'Art.', '[ANTES] Estado Previo / Texto Anterior' y '[DESPUÉS] Disposición Nueva / Texto Reformado'. Las celdas deben tener un borde sutil (\`border: 1px solid #333;\`) y texto blanco. Sé sumamente preciso con la transcripción de las variaciones normativas.

2. <h2 style="color:#4CAF50; font-size:18px; border-bottom:1px solid #4CAF50; padding-bottom:5px; margin-top:30px;">➕ NUEVAS LEYES PUBLICADAS PARA INCORPORAR</h2>
Identifica cuerpos normativos de reciente creación (Leyes completas, reglamentos nuevos, amnistías) que no figuren en nuestro catálogo. Detalla:
- Nombre completo de la nueva Ley.
- Número de Decreto legislativo que le da origen.
- Fecha de inserción/vigencia en La Gaceta.
- Un resumen ejecutivo sucinto sobre su impacto o campo de aplicación.

3. <h2 style="color:#f44336; font-size:18px; border-bottom:1px solid #f44336; padding-bottom:5px; margin-top:30px;">❌ DEROGACIONES EXPRESAS O TOTALES</h2>
Lista los documentos de nuestra biblioteca jurídica que pierden vigencia en su totalidad debido a un instrumento posterior. Indica con claridad el instrumento legal derogatorio y la fecha correspondiente.

REGLAS ESTRICTAS DE RESPUESTA:
- Bajo ninguna circunstancia inventes o deduzcas números de artículos, reformas o textos de leyes que no estén explícitamente citados o detallados en los textos provistos. Si un artículo se reformó pero la fuente no detalla el texto exacto del 'Antes' o el 'Después', explica el cambio conceptualmente en la tabla en lugar de inventar la redacción literal.
- No añadas bloques de código markdown (\`\`\`html) en el output. Devuelve el HTML plano.`,
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      throw new Error(`OpenAI error: ${await openaiRes.text()}`);
    }

    const openaiData = await openaiRes.json();
    let analysisHtml = openaiData.choices?.[0]?.message?.content?.trim() ?? "";

    if (!analysisHtml) {
      throw new Error("Respuesta vacía de OpenAI");
    }

    // Sanitización básica para remover posibles bloques contenedores de markdown que el modelo a veces concatena por inercia
   if (analysisHtml.startsWith("```html")) {
  analysisHtml = analysisHtml.replace(/^
```html\s*|\s*```$/g, "");
} else if (analysisHtml.startsWith("```")) {
  analysisHtml = analysisHtml.replace(/^```\s*|\s*```$/g, "");
}

    // Paso 4: Construcción del cascarón de correo responsivo y despacho vía Resend
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
          <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;-webkit-font-smoothing:antialiased;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="650" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;border-radius:12px;overflow:hidden;box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                    <tr>
                      <td style="background-color:#0f3460;padding:35px 30px;text-align:center;">
                        <h1 style="color:#4CAF50;margin:0;font-size:26px;font-weight:bold;letter-spacing:0.5px;">📚 Biblioteca Legal HN</h1>
                        <p style="color:#ffffff;margin:10px 0 0;font-size:15px;opacity:0.95;">Reporte Crítico de Auditoría Legal y Reformas</p>
                        <p style="color:#aaaaaa;margin:6px 0 0;font-size:12px;text-transform:capitalize;">
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
                      <td style="padding:35px;color:#ffffff;line-height:1.6;font-size:15px;">
                        ${analysisHtml}
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color:#0f3460;padding:25px;text-align:center;border-top:1px solid #252545;">
                        <p style="color:#aaaaaa;margin:0 0 8px;font-size:12px;">
                          Este correo fue estructurado y generado automáticamente por el subsistema de auditoría de Biblioteca Legal HN.
                        </p>
                        <a href="https://www.bibliotecalegalhn.com" style="color:#4CAF50;font-size:13px;text-decoration:none;font-weight:bold;">
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
