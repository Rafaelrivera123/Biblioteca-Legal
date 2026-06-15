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
async function getRelevantArticles(documentId: string, query: string): Promise<string> {
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
    console.log("[chat/legal] articles found:", articles.length, articles.map((a) => `art.${a.articleNumber}`));
    if (articles.length === 0) return "";
    return articles
      .map((a) => {
        const label = a.articleLabel ?? String(a.articleNumber);
        return `Articulo ${label}: ${a.contentPlainText}`;
      })
      .join("\n\n");
  } catch (err) {
    console.error("[chat/legal] getRelevantArticles error:", err);
    return "";
  }
}
export async function POST(req: NextRequest) {
  try {
    const cu = await auth();
    const isLoggedin = !!cu?.user?.id;
    const userId = cu?.user?.id ?? null;
    let isAdmin = false;
    let hasSubscription = false;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          userSubscription: {
            select: { isActive: true, currentPeriodEnd: true },
          },
        },
      });
      isAdmin = user?.role === "admin";
      hasSubscription =
        isAdmin ||
        !!(
          user?.userSubscription?.isActive &&
          new Date(user.userSubscription.currentPeriodEnd) > new Date()
        );
    }
    const body = await req.json().catch(() => ({}));
    const { message, documentName, documentId, history, isFreeTrial } = body as {
      message: string;
      documentName: string;
      documentId: string;
      history: { role: "user" | "model"; text: string }[];
      isFreeTrial?: boolean;
    };
    if (!message?.trim() || !documentName) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    // Usuarios sin suscripción solo pueden usar el chat si es su pregunta
    // gratis por documento (validado también en el cliente vía localStorage).
    if (!hasSubscription) {
      if (!isFreeTrial) {
        return NextResponse.json({ error: "Sin suscripción activa" }, { status: 403 });
      }
      if (!documentId) {
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
      }
    }
    const today = new Date().toISOString().split("T")[0];
    if (isLoggedin && hasSubscription && !isAdmin && userId) {
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
    const relevantArticles = documentId
      ? await getRelevantArticles(documentId, message)
      : "";
    const systemPrompt = relevantArticles
      ? `Eres un asistente legal especializado en "${documentName}".
TU FUNCION:
Analizar casos practicos y preguntas legales utilizando exclusivamente los articulos de "${documentName}" como fundamento. No eres un interprete de la ley, eres un analizador que conecta los hechos del caso con lo que la ley dice textualmente.
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
- Si los articulos disponibles no cubren el caso completamente, indicalo claramente.
- No uses frases como "es importante destacar", "cabe mencionar", "podria interpretarse", "en este sentido", ni similares.
FORMATO DE RESPUESTA:
**Analisis del caso:**
[Identificacion breve de los elementos juridicos del caso]
**Fundamento legal:**
Articulo [numero]: [texto literal]
[repetir por cada articulo relevante]
**Conclusion:**
[Lo que se desprende directamente de los articulos citados, sin agregar nada mas]
ARTICULOS ENCONTRADOS EN "${documentName}":
${relevantArticles}`
      : `Eres un asistente legal especializado en "${documentName}".
No se encontraron articulos para esta consulta en la base de datos. Informa al usuario que no encontraste articulos relacionados y que busque directamente en el documento en Biblioteca Legal HN.
REGLA ABSOLUTA: NUNCA inventes articulos ni contenido cuando no hay resultados disponibles.`;
    const groqMessages: object[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8).map((h) => ({
        role: h.role === "model" ? "assistant" : "user",
        content: h.text,
      })),
      { role: "user", content: message },
    ];
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        max_tokens: 1500,
        temperature: 0,
      }),
    });
    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[chat/legal] Groq error:", errText);
      return NextResponse.json({ error: "Error al contactar IA" }, { status: 500 });
    }
    const groqData = await groqRes.json();
    const reply = groqData.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) {
      return NextResponse.json({ error: "Sin respuesta de IA" }, { status: 500 });
    }
    if (isLoggedin && hasSubscription && !isAdmin && userId) {
      await prisma.chatUsage.upsert({
        where: { userId_date: { userId, date: today } },
        update: { count: { increment: 1 } },
        create: { userId, date: today, count: 1 },
      });
    }
    let remaining: number | null = null;
    if (isAdmin) {
      remaining = 999;
    } else if (isLoggedin && hasSubscription && userId) {
      const updatedUsage = await prisma.chatUsage.findUnique({
        where: { userId_date: { userId, date: today } },
      });
      remaining = DAILY_LIMIT - (updatedUsage?.count ?? 1);
    }
    return NextResponse.json({ reply, remaining });
  } catch (err) {
    console.error("[chat/legal] ERROR:", String(err));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
