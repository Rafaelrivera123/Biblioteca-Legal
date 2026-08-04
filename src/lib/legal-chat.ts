import { getQueryEmbedding } from "@/lib/embeddings";
import { prisma } from "@/lib/db";

export const DAILY_CHAT_LIMIT = 20;
/** Lifetime free AI chats for non-subscribed logged-in users (server-tracked). */
export { FREE_AI_CHAT_LIMIT } from "@/lib/pricing";
export const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
export const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";
export const GROQ_VISION_MODEL = "qwen/qwen3.6-27b";

export async function getDocumentScopedArticles(
  documentId: string,
  query: string
): Promise<string> {
  try {
    type ArticleRaw = {
      articleNumber: number;
      articleLabel: string | null;
      contentPlainText: string;
    };
    const embedding = await getQueryEmbedding(query);
    const vectorStr = `[${embedding.join(",")}]`;
    const articles = await prisma.$queryRawUnsafe<ArticleRaw[]>(
      `SELECT a."articleNumber", a."articleLabel", a."contentPlainText"
       FROM "Article" a
       JOIN "Chapter" c ON a."chapterId" = c.id
       JOIN "Section" s ON c."sectionId" = s.id
       WHERE s."documentId" = $1
       AND a.embedding IS NOT NULL
       ORDER BY a.embedding <=> $2::vector
       LIMIT 10`,
      documentId,
      vectorStr
    );
    if (articles.length === 0) return "";
    return articles
      .map((a) => {
        const label = a.articleLabel ?? String(a.articleNumber);
        return `Articulo ${label}: ${a.contentPlainText}`;
      })
      .join("\n\n");
  } catch (err) {
    console.error("[legal-chat] getDocumentScopedArticles error:", err);
    return "";
  }
}

export function extractArticleNumbers(text: string): number[] {
  const numbers: number[] = [];
  const patterns = [/art[ií]culo[s]?\s+(\d+)/gi, /art\.\s*(\d+)/gi, /art\s+(\d+)/gi];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && !numbers.includes(num)) numbers.push(num);
    }
  }
  return numbers;
}

export async function detectDocumentFromCurrentMessage(
  query: string
): Promise<string[]> {
  try {
    const documents = await prisma.document.findMany({
      select: { id: true, name: true },
    });
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "");
    const queryNorm = normalize(query);
    const matched: string[] = [];
    for (const doc of documents) {
      const nameNorm = normalize(doc.name);
      const nameWords = nameNorm.split(" ").filter((w) => w.length > 3);
      if (nameWords.length === 0) continue;
      const matchCount = nameWords.filter((w) => queryNorm.includes(w)).length;
      const score = matchCount / nameWords.length;
      if (score >= 0.6) matched.push(doc.id);
    }
    return matched;
  } catch (err) {
    console.error("[legal-chat] detectDocumentFromCurrentMessage error:", err);
    return [];
  }
}

export async function getGlobalRelevantArticles(
  query: string,
  history: { role: string; text: string }[]
): Promise<string> {
  try {
    type ArticleRaw = {
      articleNumber: number;
      articleLabel: string | null;
      contentPlainText: string;
      documentName: string;
      documentSlug: string;
    };

    const detectedDocumentIds = await detectDocumentFromCurrentMessage(query);
    const hasDocumentFilter = detectedDocumentIds.length > 0;
    const recentContext = [...history.slice(-2).map((h) => h.text), query].join(" ");
    const mentionedArticleNumbers = extractArticleNumbers(recentContext);
    const embedding = await getQueryEmbedding(query.slice(0, 2000));
    const vectorStr = `[${embedding.join(",")}]`;

    let exactArticles: ArticleRaw[] = [];
    if (mentionedArticleNumbers.length > 0) {
      if (hasDocumentFilter) {
        exactArticles = await prisma.$queryRawUnsafe<ArticleRaw[]>(
          `SELECT a."articleNumber", a."articleLabel", a."contentPlainText", d."name" as "documentName", d."slug" as "documentSlug"
           FROM "Article" a
           JOIN "Chapter" c ON a."chapterId" = c.id
           JOIN "Section" s ON c."sectionId" = s.id
           JOIN "Document" d ON s."documentId" = d.id
           WHERE s."documentId" = ANY($1::text[])
           AND a."articleNumber" = ANY($2::int[])
           ORDER BY a."articleNumber"
           LIMIT 10`,
          detectedDocumentIds,
          mentionedArticleNumbers
        );
      } else {
        exactArticles = await prisma.$queryRawUnsafe<ArticleRaw[]>(
          `SELECT a."articleNumber", a."articleLabel", a."contentPlainText", d."name" as "documentName", d."slug" as "documentSlug"
           FROM "Article" a
           JOIN "Chapter" c ON a."chapterId" = c.id
           JOIN "Section" s ON c."sectionId" = s.id
           JOIN "Document" d ON s."documentId" = d.id
           WHERE a."articleNumber" = ANY($1::int[])
           AND a.embedding IS NOT NULL
           ORDER BY a.embedding <=> $2::vector
           LIMIT 10`,
          mentionedArticleNumbers,
          vectorStr
        );
      }
    }

    const exactArticleKeys = new Set(
      exactArticles.map((a) => `${a.documentName}-${a.articleNumber}`)
    );

    let vectorArticles: ArticleRaw[];
    if (hasDocumentFilter) {
      vectorArticles = await prisma.$queryRawUnsafe<ArticleRaw[]>(
        `SELECT a."articleNumber", a."articleLabel", a."contentPlainText", d."name" as "documentName", d."slug" as "documentSlug"
         FROM "Article" a
         JOIN "Chapter" c ON a."chapterId" = c.id
         JOIN "Section" s ON c."sectionId" = s.id
         JOIN "Document" d ON s."documentId" = d.id
         WHERE s."documentId" = ANY($1::text[])
         AND a.embedding IS NOT NULL
         ORDER BY a.embedding <=> $2::vector
         LIMIT 12`,
        detectedDocumentIds,
        vectorStr
      );
    } else {
      vectorArticles = await prisma.$queryRawUnsafe<ArticleRaw[]>(
        `SELECT a."articleNumber", a."articleLabel", a."contentPlainText", d."name" as "documentName", d."slug" as "documentSlug"
         FROM "Article" a
         JOIN "Chapter" c ON a."chapterId" = c.id
         JOIN "Section" s ON c."sectionId" = s.id
         JOIN "Document" d ON s."documentId" = d.id
         WHERE a.embedding IS NOT NULL
         ORDER BY a.embedding <=> $1::vector
         LIMIT 15`,
        vectorStr
      );
    }

    const filteredVectorArticles = vectorArticles.filter(
      (a) => !exactArticleKeys.has(`${a.documentName}-${a.articleNumber}`)
    );
    const combined = [...exactArticles, ...filteredVectorArticles];
    if (combined.length === 0) return "";

    return combined
      .map((a) => {
        const label = a.articleLabel ?? String(a.articleNumber);
        const url = `https://www.bibliotecalegalhn.com/collections/${a.documentSlug}`;
        return `[${a.documentName}](${url}) Articulo ${label}: ${a.contentPlainText}`;
      })
      .join("\n\n");
  } catch (err) {
    console.error("[legal-chat] getGlobalRelevantArticles error:", String(err));
    return "";
  }
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
