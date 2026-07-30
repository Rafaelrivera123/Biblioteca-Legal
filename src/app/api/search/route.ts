import { prisma } from "@/lib/db";
import { getQueryEmbedding } from "@/lib/embeddings";
import {
  SEARCH_HL_START,
  SEARCH_HL_END,
  type SearchMode,
  type SearchDocumentResult,
  type SearchArticleResult,
  type SearchResponse,
} from "@/lib/search-shared";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type RawArticleRow = {
  id: string;
  articleNumber: number;
  articleLabel: string | null;
  contentPlainText?: string | null;
  snippet?: string | null;
  documentId: string;
  documentName: string;
  documentSlug: string | null;
};

function buildSnippet(row: RawArticleRow): string {
  if (row.snippet) return row.snippet;
  if (row.contentPlainText) {
    const trimmed = row.contentPlainText.trim();
    return trimmed.length > 220 ? `${trimmed.slice(0, 220)}…` : trimmed;
  }
  return "";
}

function toResult(row: RawArticleRow): SearchArticleResult {
  return {
    id: row.id,
    articleNumber: row.articleNumber,
    articleLabel: row.articleLabel,
    snippet: buildSnippet(row),
    documentId: row.documentId,
    documentName: row.documentName,
    documentSlug: row.documentSlug,
  };
}

async function searchDocuments(trimmed: string, limit: number): Promise<SearchDocumentResult[]> {
  const likeQuery = `%${trimmed.toLowerCase()}%`;
  return prisma.$queryRaw<SearchDocumentResult[]>`
    SELECT d.id, d.name, d.slug, d.short_description, d.law_number,
      GREATEST(
        similarity(d.name, ${trimmed}),
        similarity(d.law_number, ${trimmed}),
        similarity(d.short_description, ${trimmed})
      ) AS relevance
    FROM "Document" d
    WHERE d.published = true
      AND (
        d.name ILIKE ${likeQuery}
        OR d.law_number ILIKE ${likeQuery}
        OR d.short_description ILIKE ${likeQuery}
        OR similarity(d.name, ${trimmed}) > 0.25
        OR similarity(d.law_number, ${trimmed}) > 0.25
        OR similarity(d.short_description, ${trimmed}) > 0.2
      )
    ORDER BY relevance DESC
    LIMIT ${limit}
  `;
}

async function searchArticlesByNumber(
  trimmed: string,
  limit: number,
  documentId?: string
): Promise<RawArticleRow[]> {
  const match = trimmed.match(/^(?:art(?:í|i)?culo\.?\s*|art\.?\s*)?(\d{1,5})$/i);
  if (!match) return [];
  const articleNumber = parseInt(match[1], 10);
  const documentCondition = documentId
    ? Prisma.sql`AND s."documentId" = ${documentId}`
    : Prisma.empty;
  return prisma.$queryRaw<RawArticleRow[]>`
    SELECT a.id, a."articleNumber", a."articleLabel", a."contentPlainText",
      d.id as "documentId", d.name as "documentName", d.slug as "documentSlug"
    FROM "Article" a
    JOIN "Chapter" c ON a."chapterId" = c.id
    JOIN "Section" s ON c."sectionId" = s.id
    JOIN "Document" d ON s."documentId" = d.id
    WHERE a."articleNumber" = ${articleNumber} AND d.published = true
      ${documentCondition}
    ORDER BY d."viewCount" DESC
    LIMIT ${limit}
  `;
}

// NOTA: la cadena de opciones de ts_headline ('StartSel=...') se escribe
// como texto SQL literal (no como ${...}) a propósito. Prisma convierte
// cada ${...} en un parámetro ligado ($1, $2...) del lado de Postgres; si
// SEARCH_HL_START/SEARCH_HL_END se interpolaran ahí, quedarían como
// parámetros posicionados DENTRO de un string ya entrecomillado, y Postgres
// rechaza la consulta por conteo de parámetros. Por eso los marcadores van
// escritos tal cual en el SQL (deben coincidir con las constantes
// exportadas en @/lib/search-shared, que sí usa el cliente).
async function searchArticlesByText(
  trimmed: string,
  limit: number,
  documentId?: string
): Promise<RawArticleRow[]> {
  const documentCondition = documentId
    ? Prisma.sql`AND s."documentId" = ${documentId}`
    : Prisma.empty;
  return prisma.$queryRaw<RawArticleRow[]>`
    SELECT a.id, a."articleNumber", a."articleLabel",
      ts_headline(
        'spanish',
        a."contentPlainText",
        plainto_tsquery('spanish', ${trimmed}),
        'StartSel=@@LEGALHL@@, StopSel=@@ENDLEGALHL@@, MaxFragments=1, MaxWords=30, MinWords=10, ShortWord=3, HighlightAll=false'
      ) as snippet,
      ts_rank(to_tsvector('spanish', a."contentPlainText"), plainto_tsquery('spanish', ${trimmed})) as rank,
      d.id as "documentId", d.name as "documentName", d.slug as "documentSlug"
    FROM "Article" a
    JOIN "Chapter" c ON a."chapterId" = c.id
    JOIN "Section" s ON c."sectionId" = s.id
    JOIN "Document" d ON s."documentId" = d.id
    WHERE d.published = true
      AND to_tsvector('spanish', a."contentPlainText") @@ plainto_tsquery('spanish', ${trimmed})
      ${documentCondition}
    ORDER BY rank DESC
    LIMIT ${limit}
  `;
}

async function literalSearch(trimmed: string, limit: number, documentId?: string) {
  const [documents, numberMatches, textMatches] = await Promise.all([
    // Si la búsqueda está acotada a un documento (buscador dentro de la
    // página del documento), no tiene sentido devolver otras leyes.
    documentId ? Promise.resolve([]) : searchDocuments(trimmed, limit),
    searchArticlesByNumber(trimmed, limit, documentId),
    searchArticlesByText(trimmed, limit, documentId),
  ]);

  const seen = new Set<string>();
  const articles: SearchArticleResult[] = [];
  for (const row of [...numberMatches, ...textMatches]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    articles.push(toResult(row));
    if (articles.length >= limit) break;
  }

  return { documents, articles };
}

async function semanticSearch(
  trimmed: string,
  limit: number,
  documentId?: string
): Promise<SearchArticleResult[]> {
  const embedding = await getQueryEmbedding(trimmed);
  const vectorStr = `[${embedding.join(",")}]`;
  const documentCondition = documentId ? `AND s."documentId" = $2` : "";
  const params: unknown[] = documentId ? [vectorStr, documentId] : [vectorStr];
  const rows = await prisma.$queryRawUnsafe<RawArticleRow[]>(
    `SELECT a.id, a."articleNumber", a."articleLabel", a."contentPlainText",
            d.id as "documentId", d.name as "documentName", d.slug as "documentSlug"
     FROM "Article" a
     JOIN "Chapter" c ON a."chapterId" = c.id
     JOIN "Section" s ON c."sectionId" = s.id
     JOIN "Document" d ON s."documentId" = d.id
     WHERE a.embedding IS NOT NULL AND d.published = true
       ${documentCondition}
     ORDER BY a.embedding <=> $1::vector
     LIMIT ${limit}`,
    ...params
  );
  return rows.map(toResult);
}

function logZeroResultSearch(query: string, source: SearchMode) {
  prisma.searchLog
    .create({ data: { query, resultsCount: 0, source } })
    .catch(() => {});
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();
    const mode: SearchMode = searchParams.get("mode") === "semantic" ? "semantic" : "literal";
    const limit = Math.min(parseInt(searchParams.get("limit") || "8", 10) || 8, 20);
    // Si viene documentId, la búsqueda se acota a ese documento (usado por
    // el buscador embebido en /collections/[id]). Si no viene, busca en
    // toda la biblioteca (usado por cualquier otro buscador global).
    const documentId = searchParams.get("documentId") || undefined;

    if (!query) {
      return NextResponse.json<SearchResponse>({
        success: true,
        query: "",
        mode,
        documents: [],
        articles: [],
      });
    }

    if (query.length > 300) {
      return NextResponse.json(
        { success: false, message: "Consulta demasiado larga" },
        { status: 400 }
      );
    }

    if (mode === "semantic") {
      if (query.length < 3) {
        return NextResponse.json(
          { success: false, message: "Escribe al menos 3 caracteres" },
          { status: 400 }
        );
      }
      const articles = await semanticSearch(query, limit, documentId);
      if (articles.length === 0) logZeroResultSearch(query, "semantic");
      return NextResponse.json<SearchResponse>({
        success: true,
        query,
        mode,
        documents: [],
        articles,
      });
    }

    const { documents, articles } = await literalSearch(query, limit, documentId);
    if (documents.length === 0 && articles.length === 0) {
      logZeroResultSearch(query, "literal");
    }
    return NextResponse.json<SearchResponse>({
      success: true,
      query,
      mode,
      documents,
      articles,
    });
  } catch (error) {
    console.error("[GET_SEARCH]", error);
    return NextResponse.json(
      { success: false, message: "Error interno" },
      { status: 500 }
    );
  }
}
