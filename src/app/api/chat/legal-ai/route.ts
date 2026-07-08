import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const DAILY_LIMIT = 20;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

async function getQueryEmbedding(query: string): Promise<number[]> {
  const res = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query.slice(0, 2000),
      dimensions: 768,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding error: ${err}`);
  }
  const data = await res.json();
  return data.data[0].embedding;
}

// Extrae números de artículo mencionados explícitamente
function extractArticleNumbers(text: string): number[] {
  const numbers: number[] = [];
  const patterns = [
    /art[ií]culo[s]?\s+(\d+)/gi,
    /art\.\s*(\d+)/gi,
    /art\s+(\d+)/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && !numbers.includes(num)) {
        numbers.push(num);
      }
    }
  }
  return numbers;
}

// Detecta nombres de documentos mencionados SOLO en el mensaje actual
async function detectDocumentFromCurrentMessage(query: string): Promise<string[]> {
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

      if (score >= 0.6) {
        matched.push(doc.id);
        console.log("[legal-ai] document matched:", doc.name, "score:", score);
      }
    }

    return matched;
  } catch (err) {
    console.error("[legal-ai] detectDocumentFromCurrentMessage error:", err);
    return [];
  }
}

async function getRelevantArticles(
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

    // Detectar documentos mencionados en el mensaje actual solamente
    const detectedDocumentIds = await detectDocumentFromCurrentMessage(query);
    const hasDocumentFilter = detectedDocumentIds.length > 0;

    // Extraer números de artículo mencionados en mensaje actual + historial reciente
    const recentContext = [...history.slice(-2).map((h) => h.text), query].join(" ");
    const mentionedArticleNumbers = extractArticleNumbers(recentContext);

    console.log("[legal-ai] mentionedArticleNumbers:", mentionedArticleNumbers);
    console.log("[legal-ai] hasDocumentFilter:", hasDocumentFilter, detectedDocumentIds);

    // Embedding solo del mensaje actual para no contaminar con historial
    const embedding = await getQueryEmbedding(query.slice(0, 2000));
    const vectorStr = `[${embedding.join(",")}]`;

    let exactArticles: ArticleRaw[] = [];

    // Búsqueda exacta por número de artículo
    if (mentionedArticleNumbers.length > 0) {
      if (hasDocumentFilter) {
        // Si mencionó una ley específica, buscar ese artículo solo en esa ley
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
        // Sin filtro de documento: buscar en toda la DB pero priorizar por similitud vectorial
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
      console.log("[legal-ai] exact articles found:", exactArticles.length, exactArticles.map((a) => `${a.documentName} art.${a.articleNumber}`));
    }

    const exactArticleKeys = new Set(
      exactArticles.map((a) => `${a.documentName}-${a.articleNumber}`)
    );

    // Búsqueda vectorial global — siempre se ejecuta para complementar
    let vectorArticles: ArticleRaw[];

    if (hasDocumentFilter) {
      // Si mencionó una ley específica, filtrar vector search por esa ley
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
      // Búsqueda global sin filtro de documento
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

    // Deduplicar: excluir del vector search lo que ya está en exactArticles
    const filteredVectorArticles = vectorArticles.filter(
      (a) => !exactArticleKeys.has(`${a.documentName}-${a.articleNumber}`)
    );

    console.log("[legal-ai] vector articles found:", filteredVectorArticles.length);

    // Exactos primero, luego vectoriales
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
    console.error("[legal-ai] getRelevantArticles error:", String(err));
    return "";
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function POST(req: NextRequest) {
  try {
    const cu = await auth();
    if (!cu?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const userId = cu.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        userSubscription: {
          select: { isActive: true, currentPeriodEnd: true },
        },
      },
    });
    const isAdmin = user?.role === "admin";
    const hasSubscription =
      isAdmin ||
      !!(
        user?.userSubscription?.isActive &&
        new Date(user.userSubscription.currentPeriodEnd) > new Date()
      );
    if (!hasSubscription) {
      return NextResponse.json({ error: "Sin suscripción activa" }, { status: 403 });
    }
    const today = new Date().toISOString().split("T")[0];
    if (!isAdmin) {
      const usage = await prisma.chatUsage.findUnique({
        where: { userId_date: { userId, date: today } },
      });
      if (usage && usage.count >= DAILY_LIMIT) {
        return NextResponse.json(
          { error: "Límite diario alcanzado", limitReached: true },
          { status: 429 }
        );
      }
    }
    const contentType = req.headers.get("content-type") ?? "";
    let message = "";
    let history: { role: string; text: string }[] = [];
    let file: File | null = null;
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      message = (formData.get("message") as string) ?? "";
      const historyRaw = (formData.get("history") as string) ?? "[]";
      history = JSON.parse(historyRaw);
      file = formData.get("file") as File | null;
    } else {
      const body = await req.json().catch(() => ({}));
      message = body.message ?? "";
      history = body.history ?? [];
    }
    if (!message?.trim() && !file) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const relevantArticles = message ? await getRelevantArticles(message, history) : "";
    console.log("[legal-ai] relevantArticles length:", relevantArticles.length);

    const systemPrompt = `Eres un asistente legal de Biblioteca Legal HN especializado en legislacion hondurena.
TU FUNCION:
Analizar casos practicos y preguntas legales de cualquier rama del derecho hondureno (penal, civil, administrativo, constitucional, laboral, familiar, mercantil, etc.) utilizando exclusivamente los articulos de la legislacion hondurena como fundamento. No eres un interprete de la ley, eres un analizador que conecta los hechos del caso con lo que la ley dice textualmente.
METODOLOGIA DE RESPUESTA:
1. Identifica los elementos juridicos relevantes del caso o pregunta.
2. Localiza los articulos aplicables en los resultados disponibles.
3. Transcribe literalmente cada articulo relevante como fundamento.
4. Concluye unicamente lo que se desprende directamente del texto de esos articulos, sin agregar nada que la ley no diga.
REGLAS ABSOLUTAS:
- Toda conclusion debe estar respaldada por un articulo especifico transcrito en la respuesta.
- NUNCA concluyas algo que no este expresamente en el texto de un articulo.
- NUNCA inventes numeros de articulos ni contenido.
- NUNCA agregues opinion, interpretacion creativa, ni contexto propio.
- Si los articulos disponibles no cubren el caso completamente, indicalo y señala que el usuario debe consultar directamente los documentos relevantes en Biblioteca Legal HN.
- No uses frases como "es importante destacar", "cabe mencionar", "podria interpretarse", "en este sentido", ni similares.
FORMATO DE RESPUESTA:
**Analisis del caso:**
[Identificacion breve de los elementos juridicos del caso]
**Fundamento legal:**
[Nombre del documento](URL) - Articulo [numero]: [texto literal]
[repetir por cada articulo relevante]
**Conclusion:**
[Lo que se desprende directamente de los articulos citados, sin agregar nada mas]
INSTRUCCION DE LINKS: Cada articulo ya viene con su URL en formato markdown. Usa exactamente esa URL. No inventes URLs.
${
  relevantArticles
    ? `ARTICULOS ENCONTRADOS EN LA BASE DE DATOS:\n\n${relevantArticles}`
    : "No se encontraron articulos para esta consulta. Informa al usuario que no encontraste resultados y que consulte directamente los documentos en Biblioteca Legal HN."
}`;

    const groqMessages: object[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8).map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.text,
      })),
    ];

    if (file) {
      const isImage = file.type.startsWith("image/");
      if (isImage) {
        const base64 = await fileToBase64(file);
        groqMessages.push({
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${file.type};base64,${base64}` } },
            { type: "text", text: message || "Identifica que articulos de la legislacion hondurena aplican a esta imagen." },
          ],
        });
      } else {
        groqMessages.push({
          role: "user",
          content: message || `Analiza este documento: ${file?.name}`,
        });
      }
    } else {
      groqMessages.push({ role: "user", content: message });
    }

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: file?.type.startsWith("image/")
          ? "qwen/qwen3.6-27b"
          : "openai/gpt-oss-120b",
        messages: groqMessages,
        max_tokens: 2000,
        temperature: 0,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[legal-ai] Groq error:", errText);
      return NextResponse.json({ error: "Error al contactar IA" }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const reply = groqData.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) {
      return NextResponse.json({ error: "Sin respuesta de IA" }, { status: 500 });
    }

    if (!isAdmin) {
      await prisma.chatUsage.upsert({
        where: { userId_date: { userId, date: today } },
        update: { count: { increment: 1 } },
        create: { userId, date: today, count: 1 },
      });
    }

    const updatedUsage = isAdmin
      ? null
      : await prisma.chatUsage.findUnique({
          where: { userId_date: { userId, date: today } },
        });
    const remaining = isAdmin ? 999 : DAILY_LIMIT - (updatedUsage?.count ?? 1);
    return NextResponse.json({ reply, remaining });
  } catch (err) {
    console.error("[legal-ai] ERROR:", String(err));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
