import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const TAVILY_API_URL = "https://api.tavily.com/search";
interface ReformArticleChange {
  gacetaNumber: string;
  articleLabel: string;
  before: string;
  after: string;
}
interface ReformItem {
  type: "REFORM";
  lawName: string;
  lawNumber: string;
  legalSource: string;
  gacetaNumber: string;
  publicationDate: string;
  context: string;
  changes: ReformArticleChange[];
}
interface NewLawItem {
  type: "NEW_LAW";
  lawName: string;
  decreeNumber: string;
  gacetaNumber: string;
  effectiveDate: string;
  context: string;
  summary: string;
}
interface RepealItem {
  type: "REPEAL";
  lawName: string;
  repealingInstrument: string;
  gacetaNumber: string;
  date: string;
  context: string;
}
type AnalysisItem = ReformItem | NewLawItem | RepealItem;
interface AnalysisResult {
  reforms: ReformItem[];
  newLaws: NewLawItem[];
  repeals: RepealItem[];
}
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
function buildReformTable(changes: ReformArticleChange[]): string {
  const rows = changes
    .map(
      (c) => `
              <tr>
                <td style="border: 1px solid #333; padding: 8px; color: #ffffff;">${c.gacetaNumber}</td>
                <td style="border: 1px solid #333; padding: 8px; color: #ffffff;">${c.articleLabel}</td>
                <td style="border: 1px solid #333; padding: 8px; color: #ffffff;">${c.before}</td>
                <td style="border: 1px solid #333; padding: 8px; color: #ffffff;">${c.after}</td>
              </tr>`
    )
    .join("");
  return `
            <table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #4CAF50; margin: 15px 0; background-color: #111122; font-size: 14px; border-collapse: collapse;">
              <tr>
                <th style="border: 1px solid #333; padding: 8px; color: #4CAF50; text-align: left;">N° Gaceta</th>
                <th style="border: 1px solid #333; padding: 8px; color: #4CAF50; text-align: left;">Art.</th>
                <th style="border: 1px solid #333; padding: 8px; color: #4CAF50; text-align: left;">[ANTES] Estado Previo / Texto Anterior</th>
                <th style="border: 1px solid #333; padding: 8px; color: #4CAF50; text-align: left;">[DESPUÉS] Disposición Nueva / Texto Reformado</th>
              </tr>${rows}
            </table>`;
}
function buildEmailHtml(analysis: AnalysisResult): string {
  const reformsHtml =
    analysis.reforms.length > 0
      ? analysis.reforms
          .map(
            (r) => `
          <p><strong>Ley Afectada:</strong> ${r.lawName} (${r.lawNumber})</p>
          <p><strong>Sustento Jurídico del Cambio:</strong> ${r.legalSource}, La Gaceta N° ${r.gacetaNumber}</p>
          <p><strong>Fecha de Publicación Oficial:</strong> ${r.publicationDate}</p>
          <p>${r.context}</p>
          ${buildReformTable(r.changes)}`
          )
          .join("<hr style='border-color:#252545; margin: 20px 0;' />")
      : `<p>No se identificaron novedades en este apartado basado en los reportes de los últimos 7 días.</p>`;
  const newLawsHtml =
    analysis.newLaws.length > 0
      ? analysis.newLaws
          .map(
            (l) => `
          <p><strong>Nombre:</strong> ${l.lawName}</p>
          <p><strong>Decreto:</strong> ${l.decreeNumber}</p>
          <p><strong>La Gaceta N°:</strong> ${l.gacetaNumber}</p>
          <p><strong>Vigencia:</strong> ${l.effectiveDate}</p>
          <p>${l.context}</p>
          <p><strong>Resumen:</strong> ${l.summary}</p>`
          )
          .join("<hr style='border-color:#252545; margin: 20px 0;' />")
      : `<p>No se identificaron novedades en este apartado basado en los reportes de los últimos 7 días.</p>`;
  const repealsHtml =
    analysis.repeals.length > 0
      ? analysis.repeals
          .map(
            (r) => `
          <p><strong>Ley Derogada:</strong> ${r.lawName}</p>
          <p><strong>Instrumento Derogatorio:</strong> ${r.repealingInstrument}</p>
          <p><strong>La Gaceta N°:</strong> ${r.gacetaNumber}</p>
          <p><strong>Fecha:</strong> ${r.date}</p>
          <p>${r.context}</p>`
          )
          .join("<hr style='border-color:#252545; margin: 20px 0;' />")
      : `<p>No se identificaron novedades en este apartado basado en los reportes de los últimos 7 días.</p>`;
  const analysisHtml = `
    <h2 style="color:#4CAF50; font-size:18px; border-bottom:1px solid #4CAF50; padding-bottom:5px; margin-top:20px;">⚠️ REFORMAS Y MODIFICACIONES DETECTADAS</h2>
    ${reformsHtml}
    <h2 style="color:#4CAF50; font-size:18px; border-bottom:1px solid #4CAF50; padding-bottom:5px; margin-top:30px;">➕ NUEVAS LEYES PUBLICADAS PARA INCORPORAR</h2>
    ${newLawsHtml}
    <h2 style="color:#f44336; font-size:18px; border-bottom:1px solid #f44336; padding-bottom:5px; margin-top:30px;">❌ DEROGACIONES EXPRESAS O TOTALES</h2>
    ${repealsHtml}
  `;
  return `
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
      `;
}
function buildPostFromItem(
  item: AnalysisItem,
  sourceWeek: Date,
  matchedDocumentId: string | null
): {
  slug: string;
  title: string;
  summary: string;
  content: string;
  changesData: Prisma.InputJsonValue | undefined;
  type: "REFORM" | "NEW_LAW" | "REPEAL";
  gacetaNumber: string | null;
  legalSource: string | null;
  relatedDocumentId: string | null;
  sourceWeek: Date;
} | null {
  const dateTag = sourceWeek.toISOString().slice(0, 10);
  if (item.type === "REFORM") {
    if (item.changes.length === 0) return null;
    const title = `Reforma a ${item.lawName}`;
    const summary = `La Gaceta N° ${item.gacetaNumber} (${item.publicationDate}) introduce reformas a ${item.lawName}. Se modifican ${item.changes.length} artículo(s).`;
    const content = `
      <p>${item.context}</p>
      <p><strong>Ley Afectada:</strong> ${item.lawName} (${item.lawNumber})</p>
      <p><strong>Sustento Jurídico del Cambio:</strong> ${item.legalSource}, La Gaceta N° ${item.gacetaNumber}</p>
      <p><strong>Fecha de Publicación Oficial:</strong> ${item.publicationDate}</p>
      ${buildReformTable(item.changes)}
    `;
    return {
      slug: `${slugify(title)}-${dateTag}`,
      title,
      summary,
      content,
      changesData: item.changes as unknown as Prisma.InputJsonValue,
      type: "REFORM",
      gacetaNumber: item.gacetaNumber,
      legalSource: item.legalSource,
      relatedDocumentId: matchedDocumentId,
      sourceWeek,
    };
  }
  if (item.type === "NEW_LAW") {
    const title = item.lawName;
    const summary = item.summary;
    const content = `
      <p>${item.context}</p>
      <p><strong>Decreto:</strong> ${item.decreeNumber}</p>
      <p><strong>La Gaceta N°:</strong> ${item.gacetaNumber}</p>
      <p><strong>Vigencia:</strong> ${item.effectiveDate}</p>
      <p><strong>Resumen:</strong> ${item.summary}</p>
    `;
    return {
      slug: `${slugify(title)}-${dateTag}`,
      title,
      summary,
      content,
      changesData: undefined,
      type: "NEW_LAW",
      gacetaNumber: item.gacetaNumber,
      legalSource: item.decreeNumber,
      relatedDocumentId: null,
      sourceWeek,
    };
  }
  // REPEAL
  const title = `Derogación de ${item.lawName}`;
  const summary = `${item.lawName} ha sido derogada mediante ${item.repealingInstrument} (La Gaceta N° ${item.gacetaNumber}, ${item.date}).`;
  const content = `
    <p>${item.context}</p>
    <p><strong>Ley Derogada:</strong> ${item.lawName}</p>
    <p><strong>Instrumento Derogatorio:</strong> ${item.repealingInstrument}</p>
    <p><strong>La Gaceta N°:</strong> ${item.gacetaNumber}</p>
    <p><strong>Fecha:</strong> ${item.date}</p>
  `;
  return {
    slug: `${slugify(title)}-${dateTag}`,
    title,
    summary,
    content,
    changesData: undefined,
    type: "REPEAL",
    gacetaNumber: item.gacetaNumber,
    legalSource: item.repealingInstrument,
    relatedDocumentId: matchedDocumentId,
    sourceWeek,
  };
}
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Paso 1: Buscar actualizaciones legales con Tavily
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
    // Paso 3: Análisis estructurado en JSON (una sola llamada a OpenAI)
    const openaiRes = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 8192,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Eres un auditor legislativo y asistente legal de élite experto en la legislación de la República de Honduras.
Tu única tarea es contrastar información del Diario Oficial 'La Gaceta' y reformas del Congreso Nacional obtenidas de internet con los documentos presentes en el catálogo del sistema.
Debes responder EXCLUSIVAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.
Bajo ninguna circunstancia inventes o deduzcas números de artículos, reformas, decretos o textos de leyes que no estén explícitamente citados o detallados en los textos provistos. Si un artículo se reformó pero la fuente no detalla el texto exacto del 'antes' o el 'después', describe el cambio conceptualmente en esos campos en lugar de inventar la redacción literal.
Para el campo "context" de cada item, escribe entre 3 y 5 párrafos en español (mínimo 280 palabras, máximo 500 palabras en total). Estructura el contenido así: (1) qué cambia exactamente y en qué consiste, con el mayor detalle concreto que permitan las fuentes; (2) el marco legal o institucional relevante (qué ley, secretaría u órgano está involucrado y por qué tiene competencia); (3) antecedentes o motivo del cambio si las fuentes lo mencionan; (4) implicaciones prácticas concretas, diferenciando el impacto para ciudadanos, empresas y/o abogados según corresponda al caso.
No repitas literalmente los datos técnicos (número de decreto, gaceta, fecha); esos van en campos separados. El "context" debe ser prosa explicativa basada estrictamente en la información de las fuentes, sin inventar implicaciones no respaldadas por el texto — si las fuentes no dan suficiente detalle para llegar al mínimo de palabras con contenido real, escribe lo que sí esté respaldado aunque quede más corto; nunca rellenes con relleno genérico.
Evita reutilizar las mismas frases de transición en items distintos (por ejemplo "Este cambio es relevante porque...", "Afecta a todos los ciudadanos, ya que..."): cada "context" debe leerse como un texto redactado de forma independiente, con su propia estructura y vocabulario, no como una plantilla rellenada.`,
          },
          {
            role: "user",
            content: `Analiza las siguientes fuentes de datos extraídas esta semana y devuelve un objeto JSON con la forma exacta:
{
  "reforms": [
    {
      "type": "REFORM",
      "lawName": string,
      "lawNumber": string,
      "legalSource": string,
      "gacetaNumber": string,
      "publicationDate": string,
      "context": string,
      "changes": [
        { "gacetaNumber": string, "articleLabel": string, "before": string, "after": string }
      ]
    }
  ],
  "newLaws": [
    {
      "type": "NEW_LAW",
      "lawName": string,
      "decreeNumber": string,
      "gacetaNumber": string,
      "effectiveDate": string,
      "context": string,
      "summary": string
    }
  ],
  "repeals": [
    {
      "type": "REPEAL",
      "lawName": string,
      "repealingInstrument": string,
      "gacetaNumber": string,
      "date": string,
      "context": string
    }
  ]
}
Si no hay datos fidedignos para una sección, devuelve un array vacío para esa sección. No agregues campos adicionales.
========================================
NOTICIAS Y RESUMEN LEGISLATIVO RECUPERADO:
${searchAnswer}
FUENTES DETALLADAS:
${searchResults.map((r: any) => `- [${r.title}]: ${r.content}`).join("\n")}
CATÁLOGO ACTUAL DE NUESTRA BIBLIOTECA LEGAL:
${JSON.stringify(documents.map((d) => ({ id: d.id, name: d.name, law_number: d.law_number })), null, 2)}
========================================`,
          },
        ],
      }),
    });
    if (!openaiRes.ok) {
      throw new Error(`OpenAI error: ${await openaiRes.text()}`);
    }
    const openaiData = await openaiRes.json();
    const rawContent = openaiData.choices?.[0]?.message?.content?.trim() ?? "";
    if (!rawContent) {
      throw new Error("Respuesta vacía de OpenAI");
    }
    let analysis: AnalysisResult;
    try {
      const parsed = JSON.parse(rawContent);
      analysis = {
        reforms: Array.isArray(parsed.reforms) ? parsed.reforms : [],
        newLaws: Array.isArray(parsed.newLaws) ? parsed.newLaws : [],
        repeals: Array.isArray(parsed.repeals) ? parsed.repeals : [],
      };
    } catch (err) {
      throw new Error(`No se pudo parsear JSON de OpenAI: ${String(err)}`);
    }
    // Paso 4: Enviar email (idéntico al diseño actual, construido en código a partir del JSON)
    await resend.emails.send({
      from: "Biblioteca Legal HN <noreply@bibliotecalegalhn.com>",
      to: "rafariveras10@gmail.com",
      subject: `📋 Actualizaciones Legales Honduras - ${new Date().toLocaleDateString(
        "es-HN",
        { weekday: "long", year: "numeric", month: "long", day: "numeric" }
      )}`,
      html: buildEmailHtml(analysis),
    });
    // Paso 5: Guardar cada item detectado como borrador para revisión manual
    const sourceWeek = new Date();
    const allItems: AnalysisItem[] = [
      ...analysis.reforms,
      ...analysis.newLaws,
      ...analysis.repeals,
    ];
    let draftsCreated = 0;
    for (const item of allItems) {
      let matchedDocumentId: string | null = null;
      if (item.type !== "NEW_LAW") {
        const match = documents.find(
          (d) =>
            d.name.toLowerCase() === item.lawName.toLowerCase() ||
            d.law_number === (item.type === "REFORM" ? item.lawNumber : "")
        );
        matchedDocumentId = match?.id ?? null;
      }
      const post = buildPostFromItem(item, sourceWeek, matchedDocumentId);
      if (!post) continue;
      const existing = await prisma.legalUpdatePost.findUnique({
        where: { slug: post.slug },
      });
      if (existing) continue;
      await prisma.legalUpdatePost.create({
        data: {
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          content: post.content,
          changesData: post.changesData,
          type: post.type,
          gacetaNumber: post.gacetaNumber,
          legalSource: post.legalSource,
          relatedDocumentId: post.relatedDocumentId,
          sourceWeek: post.sourceWeek,
          status: "draft",
        },
      });
      draftsCreated += 1;
    }
    return NextResponse.json({
      success: true,
      results_found: searchResults.length,
      drafts_created: draftsCreated,
    });
  } catch (error) {
    console.error("Error en weekly-update:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
