import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Costo del análisis (objetivo: < ~$0.01 / Gaceta) ──────────────────
// Haiku 4.5 ≈ $1/MTok input + $5/MTok output. Con ~4k tokens de input
// (extracto) + ~500–800 de output cortos ⇒ ~$0.006–$0.01. Sonnet con
// 100k+ chars y contexts largos era ~$0.30–$0.50+ por Gaceta.
const ANALYSIS_MODEL = "claude-haiku-4-5-20251001";
/** Caracteres del PDF que mandamos a la IA (el resto se ignora). */
const ANALYSIS_INPUT_CHARS = 16_000;
/** Tope de salida: items cortos, sin ensayos. */
const ANALYSIS_MAX_TOKENS = 2_000;
const ANALYSIS_TIMEOUT_MS = 60_000;

// Tope local al extraer texto (memoria). NO se manda entero a la IA —
// solo ANALYSIS_INPUT_CHARS. Si el PDF supera esto, pedimos dividirlo.
const MAX_EXTRACT_CHARS = 500_000;

// Tope de páginas del PDF que mandamos a Claude como documento cuando
// pdf-parse/unpdf fallan. Cada página se factura como texto + imagen.
export const DESCRIPTION_PDF_MAX_PAGES = 3;

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

/**
 * Los errores de validación de Prisma (ej. "Invalid `prisma.X.create()`
 * invocation") empiezan volcando el objeto COMPLETO que se le pasó a la
 * query —acá eso incluye el HTML entero de un artículo, que fácilmente son
 * miles de caracteres— y la razón real del error ("Argument `X` is
 * missing.", "Invalid value provided...", etc.) queda SIEMPRE al final del
 * mensaje, después de ese volcado. Cortar por los primeros 500 caracteres
 * (como hacía este código antes) solo mostraba un pedazo del volcado del
 * objeto y nunca llegaba a la razón real, dejando el errorMessage guardado
 * en la Gaceta inútil para diagnosticar cualquier fallo de Prisma. Nos
 * quedamos con el FINAL del mensaje en vez del principio.
 */
function truncateErrorMessage(message: string, maxLen = 800): string {
  if (message.length <= maxLen) return message;
  return `…${message.slice(-maxLen)}`;
}

/**
 * Une una lista de strings en español con comas y un "y" final, sin comilla
 * de Oxford (ej. ["a", "b", "c"] -> "a, b y c"), para armar la descripción
 * corta de la Gaceta en una sola oración legible.
 */
export function joinSpanishList(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}

/** Recorta a un máximo de palabras, con ellipsis si hace falta. */
export function capWords(text: string, maxWords = 40): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

/**
 * Arma un resumen corto (máx. 40 palabras) a partir de actualizaciones ya
 * identificadas (títulos/tipos). Costo cero de IA — se usa al procesar y
 * también desde "Generar con IA" cuando ya hay drafts/publicados.
 */
export function buildGacetaDescriptionFromParts(parts: string[]): string | null {
  if (parts.length === 0) return null;
  return capWords(`Esta edición trae ${joinSpanishList(parts)}.`);
}

/**
 * Arma un resumen corto (máx. 40 palabras) de qué contiene la Gaceta, a
 * partir de las reformas/leyes nuevas/derogaciones que la IA identificó en
 * `analyzeGacetaText`. Se guarda en `Gaceta.description` para mostrarlo en
 * la tarjeta pública de /gacetas — el admin puede corregirlo a mano después
 * desde /dashboard/gacetas si el resultado automático no queda claro.
 *
 * Devuelve null cuando el análisis no encontró ningún cambio relevante
 * (Gaceta procesada pero sin actualizaciones), para que la UI pública
 * pueda distinguir ese caso de "todavía no se ha analizado".
 */
function buildGacetaDescription(analysis: AnalysisResult): string | null {
  const allItems: AnalysisItem[] = [
    ...analysis.reforms,
    ...analysis.newLaws,
    ...analysis.repeals,
  ];
  if (allItems.length === 0) return null;

  const parts = allItems.map((item) => {
    if (item.type === "REFORM") return `reforma a ${item.lawName}`;
    if (item.type === "NEW_LAW") return `la nueva ley "${item.lawName}"`;
    return `la derogación de ${item.lawName}`;
  });

  return buildGacetaDescriptionFromParts(parts);
}

/**
 * Misma idea que `buildGacetaDescription`, pero a partir de posts ya
 * guardados en LegalUpdatePost (title + type), sin volver a llamar a la IA.
 */
export function buildGacetaDescriptionFromUpdates(
  updates: { type: string; title: string }[]
): string | null {
  if (updates.length === 0) return null;

  const parts = updates.map((u) => {
    const title = u.title.trim();
    if (u.type === "REFORM") {
      if (/^reforma\b/i.test(title)) {
        return title.charAt(0).toLowerCase() + title.slice(1);
      }
      return `reforma relacionada con ${title}`;
    }
    if (u.type === "NEW_LAW") return `la nueva ley "${title}"`;
    if (u.type === "REPEAL") {
      if (/^derogaci/i.test(title)) {
        return `la ${title.charAt(0).toLowerCase()}${title.slice(1)}`;
      }
      return `la derogación de ${title}`;
    }
    return title;
  });

  return buildGacetaDescriptionFromParts(parts);
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

/**
 * Fuerza a string cualquier valor que venga directo del JSON de la IA sin
 * pasar por un template literal (que ya coerciona solo). Se detectó en
 * producción que un `prisma.legalUpdatePost.create()` puede fallar con
 * "Invalid invocation" cuando la IA devuelve, por ejemplo, `gacetaNumber`
 * como número en vez de string ("37183" sin comillas) — Prisma rechaza el
 * tipo y el error real queda enterrado dentro del volcado del objeto (ver
 * [[truncateErrorMessage]]). Estos campos (title, summary, gacetaNumber,
 * legalSource) se asignan DIRECTO desde el item de la IA sin pasar por un
 * template literal en ningún lado, así que son los únicos con este riesgo.
 */
function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}
function strOrNull(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return null;
  return String(value);
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
      gacetaNumber: strOrNull(item.gacetaNumber),
      legalSource: strOrNull(item.legalSource),
      relatedDocumentId: matchedDocumentId,
      sourceWeek,
    };
  }
  if (item.type === "NEW_LAW") {
    const title = str(item.lawName, "Ley sin título");
    const summary = str(item.summary);
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
      gacetaNumber: strOrNull(item.gacetaNumber),
      legalSource: strOrNull(item.decreeNumber),
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
    gacetaNumber: strOrNull(item.gacetaNumber),
    legalSource: strOrNull(item.repealingInstrument),
    relatedDocumentId: matchedDocumentId,
    sourceWeek,
  };
}

function assertPdfMagic(buffer: Buffer): void {
  // Un PDF válido empieza con "%PDF". Si Blob devolvió HTML/JSON (enlace
  // roto, auth wall, etc.) o el bytea en Neon está corrupto, pdf-parse
  // tira InvalidPDFException con poco contexto — mejor fallar acá.
  if (buffer.length < 5 || buffer.subarray(0, 4).toString("latin1") !== "%PDF") {
    throw new Error(
      "El archivo descargado no es un PDF válido (falta la cabecera %PDF). Vuelve a subir la Gaceta."
    );
  }
}

/**
 * Trae los bytes del PDF de una Gaceta. Las Gacetas subidas desde el
 * cambio a Vercel Blob (2026-07-29) solo tienen `pdfUrl`, así que se
 * descargan de ahí; las subidas antes de ese cambio todavía pueden tener
 * `pdfData` (bytea en Neon) como fallback.
 */
export async function loadGacetaPdfBuffer(
  pdfUrl: string | null,
  pdfData: Uint8Array | Buffer | null
): Promise<Buffer> {
  if (pdfUrl) {
    const res = await fetch(pdfUrl);
    if (!res.ok) {
      throw new Error(
        `No se pudo descargar el PDF de la Gaceta desde Blob storage (status ${res.status}).`
      );
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    assertPdfMagic(buffer);
    return buffer;
  }
  if (pdfData) {
    const buffer = Buffer.from(pdfData);
    assertPdfMagic(buffer);
    return buffer;
  }
  throw new Error(
    "Esta Gaceta no tiene archivo guardado (se borró o nunca se subió bien). Vuelve a subirla."
  );
}

function isPdfParseInvalidError(err: unknown): boolean {
  const name = err instanceof Error ? err.name : "";
  const message = err instanceof Error ? err.message : String(err);
  return name === "InvalidPDFException" || /invalid pdf/i.test(message);
}

/**
 * Extrae texto con unpdf (PDF.js moderno). pdf-parse usa un motor viejo que
 * rechaza bastantes PDFs oficiales de La Gaceta; unpdf suele leerlos.
 */
async function extractTextWithUnpdf(pdfData: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(pdfData));
  const result = await extractText(pdf, { mergePages: true });
  const text = (typeof result.text === "string" ? result.text : "").trim();
  if (!text) throw new Error("No se pudo extraer texto del PDF (vacío)");
  return text;
}

async function extractPdfTextWithFallback(pdfData: Buffer): Promise<string> {
  assertPdfMagic(pdfData);
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(pdfData);
    const text = data.text?.trim() ?? "";
    if (!text) throw new Error("No se pudo extraer texto del PDF (vacío)");
    return text;
  } catch (err) {
    // pdf-parse falla con InvalidPDFException / vacío en PDFs oficiales;
    // unpdf (PDF.js actual) es el plan B barato antes de mandar el binario
    // a Anthropic (que también rechaza muchos de estos archivos).
    console.warn(
      "[extractPdfText] pdf-parse falló, probando unpdf:",
      err instanceof Error ? err.message : err
    );
    try {
      return await extractTextWithUnpdf(pdfData);
    } catch (unpdfErr) {
      if (isPdfParseInvalidError(err) || isPdfParseInvalidError(unpdfErr)) {
        throw new Error(
          "No se pudo leer este PDF (estructura no soportada o archivo dañado). Prueba volver a subirlo; si sigue fallando, escribe la descripción a mano."
        );
      }
      throw unpdfErr instanceof Error ? unpdfErr : err;
    }
  }
}

export async function extractPdfText(pdfData: Buffer): Promise<string> {
  const text = await extractPdfTextWithFallback(pdfData);
  if (text.length > MAX_EXTRACT_CHARS) {
    throw new Error(
      `Esta Gaceta es demasiado grande para leerla de una vez (${text.length.toLocaleString()} caracteres). Divide el PDF en partes y súbelas por separado.`
    );
  }
  return text;
}

/**
 * Recorta el texto que se manda a la IA. Las Gacetas oficiales suelen
 * poner decretos/acuerdos relevantes al inicio; mandar 100k+ chars era
 * lo que llevaba el costo a decenas de centavos.
 */
function selectAnalysisExcerpt(gacetaText: string): string {
  if (gacetaText.length <= ANALYSIS_INPUT_CHARS) return gacetaText;
  return gacetaText.slice(0, ANALYSIS_INPUT_CHARS);
}

/**
 * Solo manda al prompt las leyes del catálogo que aparecen en el extracto
 * (o un subconjunto corto). El catálogo completo inflaba el input gratis.
 */
function selectRelevantDocuments(
  excerpt: string,
  documents: { id: string; name: string; law_number: string }[]
): { id: string; name: string; law_number: string }[] {
  const lower = excerpt.toLowerCase();
  const matched = documents.filter((d) => {
    const name = d.name?.trim();
    const num = d.law_number?.trim();
    return (
      (!!name && lower.includes(name.toLowerCase())) ||
      (!!num && lower.includes(num.toLowerCase()))
    );
  });
  if (matched.length > 0) return matched.slice(0, 30);
  // Sin coincidencias: catálogo mínimo para que pueda enlazar si acierta
  // el nombre; 40 entradas cortas cuestan poco vs mandar todo.
  return documents.slice(0, 40);
}

/**
 * Igual que `extractPdfText`, pero sin el tope de MAX_CHARS: para generar
 * una descripción corta solo necesitamos un extracto, no el análisis
 * completo. Si el PDF es enorme, igual devolvemos el texto y el caller
 * recorta.
 */
export async function extractPdfTextForDescription(
  pdfData: Buffer
): Promise<string> {
  return extractPdfTextWithFallback(pdfData);
}

/**
 * Devuelve un PDF nuevo con solo las primeras `maxPages` páginas. Se usa
 * antes de mandar el archivo a Claude como documento: así no se factura
 * (ni se intenta parsear) una Gaceta de decenas/centenas de páginas solo
 * para escribir una oración de descripción.
 */
export async function slicePdfFirstPages(
  pdfData: Buffer,
  maxPages = DESCRIPTION_PDF_MAX_PAGES
): Promise<{ buffer: Buffer; totalPages: number; usedPages: number }> {
  assertPdfMagic(pdfData);
  const { PDFDocument } = await import("pdf-lib");
  const source = await PDFDocument.load(pdfData, { ignoreEncryption: true });
  const totalPages = source.getPageCount();
  const usedPages = Math.min(maxPages, totalPages);
  if (usedPages >= totalPages) {
    return { buffer: pdfData, totalPages, usedPages: totalPages };
  }

  const out = await PDFDocument.create();
  const indices = Array.from({ length: usedPages }, (_, i) => i);
  const copied = await out.copyPages(source, indices);
  for (const page of copied) out.addPage(page);
  return {
    buffer: Buffer.from(await out.save()),
    totalPages,
    usedPages,
  };
}

async function analyzeGacetaText(
  gacetaNumber: string,
  gacetaText: string,
  documents: { id: string; name: string; law_number: string }[]
): Promise<AnalysisResult> {
  const excerpt = selectAnalysisExcerpt(gacetaText);
  const catalog = selectRelevantDocuments(excerpt, documents);
  const truncatedNote =
    gacetaText.length > excerpt.length
      ? ` (extracto de los primeros ${excerpt.length.toLocaleString()} caracteres de ${gacetaText.length.toLocaleString()}; prioriza lo que aparezca aquí)`
      : "";

  // Haiku + extracto corto: no hace falta streaming (el request es chico).
  // Timeout 60s deja margen amplio bajo los 300s de maxDuration.
  let response;
  try {
    response = await anthropic.messages.create(
      {
        model: ANALYSIS_MODEL,
        max_tokens: ANALYSIS_MAX_TOKENS,
        messages: [
          {
            role: "user",
            content: `Eres un auditor legislativo de Honduras. Del texto de La Gaceta N° ${gacetaNumber}${truncatedNote}, identifica entre 0 y 5 actualizaciones legales RELEVANTES (reformas, leyes nuevas, derogaciones). No fuerces un número. Ignora trámites administrativos menores.

Reglas de economía (obligatorias):
- "context": máximo 40 palabras.
- "summary" (NEW_LAW): máximo 40 palabras.
- REFORM "changes": máximo 3 artículos; "before"/"after" en máximo 2 oraciones cada uno (resumen fiel, no transcripción larga).
- No inventes decretos, artículos ni textos que no estén en el extracto.
- Si una ley del catálogo coincide, usa exactamente su "name" como lawName.

Catálogo (subset):
${JSON.stringify(catalog.map((d) => ({ name: d.name, law_number: d.law_number })))}

Texto:
${excerpt}

Responde ÚNICAMENTE JSON válido (sin markdown) con esta forma:
{"reforms":[{"type":"REFORM","lawName":"...","lawNumber":"...","legalSource":"...","gacetaNumber":"${gacetaNumber}","publicationDate":"...","context":"...","changes":[{"gacetaNumber":"${gacetaNumber}","articleLabel":"...","before":"...","after":"..."}]}],"newLaws":[{"type":"NEW_LAW","lawName":"...","decreeNumber":"...","gacetaNumber":"${gacetaNumber}","effectiveDate":"...","context":"...","summary":"..."}],"repeals":[{"type":"REPEAL","lawName":"...","repealingInstrument":"...","gacetaNumber":"${gacetaNumber}","date":"...","context":"..."}]}
Arrays vacíos si no hay nada fidedigno.`,
          },
        ],
      },
      { timeout: ANALYSIS_TIMEOUT_MS }
    );
  } catch (err: unknown) {
    const errName = err instanceof Error ? err.name : undefined;
    const errMessage = err instanceof Error ? err.message : String(err);
    const isTimeout =
      errName === "APIConnectionTimeoutError" ||
      /timed? ?out/i.test(errMessage);
    if (isTimeout) {
      throw new Error(
        `El análisis con IA de la Gaceta ${gacetaNumber} no terminó a tiempo. Vuelve a intentarlo con "Reintentar"; si sigue fallando, divide el PDF.`
      );
    }
    throw err;
  }

  const block = response.content[0];
  const rawText = block?.type === "text" ? block.text : "";
  const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      `La respuesta de la IA se cortó por el límite de tokens (Gaceta ${gacetaNumber}). Reintenta; si persiste, divide el PDF.`
    );
  }

  if (!cleaned) {
    throw new Error(
      `La IA no devolvió contenido para la Gaceta ${gacetaNumber} (stop_reason: ${response.stop_reason}).`
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new Error(
      `La IA no devolvió JSON válido para la Gaceta ${gacetaNumber} (${cleaned.length} caracteres recibidos, stop_reason: ${response.stop_reason}).`
    );
  }

  return {
    reforms: Array.isArray(parsed.reforms) ? parsed.reforms : [],
    newLaws: Array.isArray(parsed.newLaws) ? parsed.newLaws : [],
    repeals: Array.isArray(parsed.repeals) ? parsed.repeals : [],
  };
}

/**
 * Procesa Gacetas pendientes de la biblioteca (subidas en /dashboard/gacetas)
 * hasta agotar la cola, el presupuesto de tiempo dado, o el tope de
 * `maxGacetas` (si se pasa). Cada Gaceta se marca "processing" antes de
 * analizarla y "processed"/"failed" al terminar, así nunca se vuelve a
 * procesar la misma Gaceta dos veces y una Gaceta con error no bloquea a
 * las demás.
 *
 * `maxGacetas` es opcional: se usa desde el botón "Procesar ahora" del
 * dashboard (con 5) para que cada click tenga un costo y un tiempo de
 * espera acotados y predecibles, en vez de vaciar de un jalón una cola de
 * 100+ Gacetas. Antes también corría sin este tope desde un cron
 * automático (weekly-update), que se eliminó — el procesamiento ahora es
 * 100% manual, solo por este botón.
 *
 * `maxDurationMs` solo controla cuándo dejar de EMPEZAR una Gaceta nueva —
 * no acota una Gaceta ya en curso. La llamada a Haiku está acotada a ~60s
 * (ver `analyzeGacetaText`); con budget de 60_000 para empezar Gacetas
 * nuevas queda margen real bajo los 300s de `maxDuration` para terminar
 * la que ya está en curso (bien o mal) sin dejarla atascada en "processing".
 */
export async function processPendingGacetas(
  maxDurationMs = 60_000,
  maxGacetas?: number
): Promise<GacetaRunSummary[]> {
  const startedAt = Date.now();
  const summaries: GacetaRunSummary[] = [];

  const documents = await prisma.document.findMany({
    where: { published: true },
    select: { id: true, name: true, law_number: true, slug: true },
  });

  while (Date.now() - startedAt < maxDurationMs) {
    if (maxGacetas !== undefined && summaries.length >= maxGacetas) break;

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
      const pdfBuffer = await loadGacetaPdfBuffer(next.pdfUrl, next.pdfData);
      const text = await extractPdfText(pdfBuffer);
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
          description: buildGacetaDescription(analysis),
          // El PDF YA NO se borra tras procesar: ahora también se muestra
          // públicamente en /gacetas, así que tiene que quedarse disponible
          // para todos los usuarios, no solo mientras esté pendiente/failed.
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
          errorMessage: truncateErrorMessage(message),
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
