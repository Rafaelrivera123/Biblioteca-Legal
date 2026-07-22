import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Mismo límite que usa /api/dashboard/generate-legal-updates: con
// claude-sonnet-5 (1M tokens de contexto) esto ya no es el cuello de
// botella real para una Gaceta individual.
const MAX_CHARS = 1_800_000;

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

export interface GacetaRunSummary {
  gacetaId: string;
  gacetaNumber: string;
  ok: boolean;
  updatesCreated: number;
  error?: string;
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

export function buildReformTable(changes: ReformArticleChange[]): string {
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

async function extractPdfText(pdfData: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(pdfData);
  const text = data.text?.trim() ?? "";
  if (!text) throw new Error("No se pudo extraer texto del PDF (vacío)");
  if (text.length > MAX_CHARS) {
    throw new Error(
      `Esta Gaceta es demasiado grande para procesarla de una vez (${text.length.toLocaleString()} caracteres). Divide el PDF en partes y súbelas por separado.`
    );
  }
  return text;
}

async function analyzeGacetaText(
  gacetaNumber: string,
  gacetaText: string,
  documents: { id: string; name: string; law_number: string }[]
): Promise<AnalysisResult> {
  const response = await anthropic.messages.create(
    {
      model: "claude-sonnet-5",
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Texto completo de La Gaceta N° ${gacetaNumber} (extraído del PDF oficial):\n\n${gacetaText}`,
            },
            {
              type: "text",
              text: `Eres un auditor legislativo experto en la legislación de la República de Honduras.

Analiza el texto completo de esta Gaceta Oficial e identifica las actualizaciones legales que de verdad importan — entre 1 y 5 en total, NUNCA fuerces llegar a un número fijo. Si esta Gaceta solo trae 1 cambio relevante, reporta solo 1. Si trae varios cambios de peso real (reformas a leyes importantes, nuevas leyes, derogaciones), reporta hasta 5, priorizando por impacto real sobre ciudadanos, empresas o el sistema legal. Ignora contenido de trámite puramente administrativo sin relevancia jurídica salvo que no haya nada más relevante en la Gaceta.

Para cada item identificado, clasifícalo como:
- "REFORM" si modifica artículos de una ley ya existente. Debes extraer, para cada artículo modificado, el texto "before" (redacción anterior) y "after" (redacción nueva), transcritos literalmente del texto de la Gaceta. Si el texto anterior no aparece en la Gaceta, describe conceptualmente el cambio en "before" sin inventar la redacción literal.
- "NEW_LAW" si crea una ley, decreto, reglamento o disposición nueva.
- "REPEAL" si deroga una ley o disposición existente.

Bajo ninguna circunstancia inventes o deduzcas números de artículos, decretos o textos que no estén explícitamente en el texto provisto.

Para el campo "context" de cada item, escribe entre 3 y 5 párrafos en español (mínimo 280, máximo 500 palabras). Estructura: (1) qué cambia exactamente y en qué consiste, con el mayor detalle concreto posible; (2) el marco legal o institucional relevante; (3) antecedentes o motivo del cambio si el texto lo menciona; (4) implicaciones prácticas concretas, diferenciando el impacto para ciudadanos, empresas y/o abogados según corresponda. No repitas los datos técnicos (decreto, gaceta, fecha) dentro del "context"; esos van en campos separados. No rellenes con relleno genérico — si el texto no da para el mínimo de palabras con contenido real, entrega lo que sí esté respaldado, aunque quede más corto. Evita reutilizar las mismas frases de transición entre items distintos.

Cuando el item sea una reforma o derogación de una ley que coincida con el catálogo de documentos que te doy abajo, usa exactamente el "name" del catálogo como "lawName" para que se pueda enlazar.

Catálogo actual de la biblioteca legal:
${JSON.stringify(documents.map((d) => ({ name: d.name, law_number: d.law_number })), null, 2)}

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código, con esta forma exacta:
{
  "reforms": [{"type":"REFORM","lawName":"...","lawNumber":"...","legalSource":"...","gacetaNumber":"${gacetaNumber}","publicationDate":"...","context":"...","changes":[{"gacetaNumber":"${gacetaNumber}","articleLabel":"...","before":"...","after":"..."}]}],
  "newLaws": [{"type":"NEW_LAW","lawName":"...","decreeNumber":"...","gacetaNumber":"${gacetaNumber}","effectiveDate":"...","context":"...","summary":"..."}],
  "repeals": [{"type":"REPEAL","lawName":"...","repealingInstrument":"...","gacetaNumber":"${gacetaNumber}","date":"...","context":"..."}]
}
Si no hay nada fidedigno para una sección, devuelve un array vacío para esa sección. No agregues campos adicionales.`,
            },
          ],
        },
      ],
    },
    { timeout: 250_000 }
  );

  const rawText = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return {
    reforms: Array.isArray(parsed.reforms) ? parsed.reforms : [],
    newLaws: Array.isArray(parsed.newLaws) ? parsed.newLaws : [],
    repeals: Array.isArray(parsed.repeals) ? parsed.repeals : [],
  };
}

/**
 * Procesa Gacetas pendientes de la biblioteca (subidas en /dashboard/gacetas)
 * hasta agotar la cola o el presupuesto de tiempo dado. Cada Gaceta se marca
 * "processing" antes de analizarla y "processed"/"failed" al terminar, así
 * nunca se vuelve a procesar la misma Gaceta dos veces y una Gaceta con
 * error no bloquea a las demás.
 */
export async function processPendingGacetas(
  maxDurationMs = 260_000
): Promise<GacetaRunSummary[]> {
  const startedAt = Date.now();
  const summaries: GacetaRunSummary[] = [];

  const documents = await prisma.document.findMany({
    where: { published: true },
    select: { id: true, name: true, law_number: true, slug: true },
  });

  while (Date.now() - startedAt < maxDurationMs) {
    const next = await prisma.gaceta.findFirst({
      where: { status: "pending" },
      orderBy: { uploadedAt: "asc" },
    });
    if (!next) break;

    // Reclamo best-effort: si algo más ya la tomó, la saltamos.
    const claimed = await prisma.gaceta.updateMany({
      where: { id: next.id, status: "pending" },
      data: { status: "processing" },
    });
    if (claimed.count === 0) continue;

    try {
      if (!next.pdfData) {
        throw new Error(
          "Esta Gaceta no tiene archivo guardado (se borró o nunca se subió bien). Vuelve a subirla."
        );
      }
      const text = await extractPdfText(Buffer.from(next.pdfData));
      const analysis = await analyzeGacetaText(next.number, text, documents);
      const sourceWeek = new Date();
      const allItems: AnalysisItem[] = [
        ...analysis.reforms,
        ...analysis.newLaws,
        ...analysis.repeals,
      ];

      let createdCount = 0;
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
        createdCount += 1;
      }

      await prisma.gaceta.update({
        where: { id: next.id },
        data: {
          status: "processed",
          updatesCreated: createdCount,
          processedAt: new Date(),
          errorMessage: null,
          // Ya no necesitamos el archivo — lo borramos de Neon para no
          // acumular peso muerto en la base de datos.
          pdfData: null,
          fileAvailable: false,
        },
      });
      summaries.push({
        gacetaId: next.id,
        gacetaNumber: next.number,
        ok: true,
        updatesCreated: createdCount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[gaceta-processor] Gaceta ${next.number} falló:`, error);
      await prisma.gaceta.update({
        where: { id: next.id },
        data: {
          status: "failed",
          errorMessage: message.slice(0, 500),
        },
      });
      summaries.push({
        gacetaId: next.id,
        gacetaNumber: next.number,
        ok: false,
        updatesCreated: 0,
        error: message,
      });
    }
  }

  return summaries;
}
