import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = 20;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

async function getRelevantArticles(documentId: string, query: string): Promise<string> {
  try {
    type ArticleRaw = {
      articleNumber: number;
      articleLabel: string | null;
      contentPlainText: string;
    };

    // Split query into words and search each one for better recall
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5);

    const conditions = words
      .map((_, i) => `a."contentPlainText" ILIKE $${i + 2}`)
      .join(" OR ");

    const whereClause = conditions
      ? `s."documentId" = $1 AND (${conditions})`
      : `s."documentId" = $1`;

    const params: unknown[] = [documentId, ...words.map((w) => `%${w}%`)];

    const articles = await prisma.$queryRawUnsafe<ArticleRaw[]>(
      `SELECT a."articleNumber", a."articleLabel", a."contentPlainText"
       FROM "Article" a
       JOIN "Chapter" c ON a."chapterId" = c.id
       JOIN "Section" s ON c."sectionId" = s.id
       WHERE ${whereClause}
       LIMIT 10`,
      ...params
    );

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

    const body = await req.json().catch(() => ({}));
    const { message, documentName, documentId, history } = body as {
      message: string;
      documentName: string;
      documentId: string;
      history: { role: "user" | "model"; text: string }[];
    };

    if (!message?.trim() || !documentName) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const relevantArticles = documentId
      ? await getRelevantArticles(documentId, message)
      : "";

    const systemPrompt = relevantArticles
      ? `Eres un asistente legal experto en legislacion hondurena. El usuario esta consultando el documento: "${documentName}".

REGLAS CRITICAS:
- Solo puedes citar articulos que aparezcan textualmente en la seccion "ARTICULOS ENCONTRADOS" de abajo.
- NUNCA inventes numeros de articulos ni contenido que no este en esa seccion.
- Si la respuesta no esta en los articulos encontrados, dilo claramente: "No encontre ese articulo especifico en los resultados disponibles. Te recomiendo buscar directamente en el documento."
- Cita el numero de articulo exacto tal como aparece en los datos.
- Razona paso a paso antes de responder.

ARTICULOS ENCONTRADOS EN "${documentName}":
${relevantArticles}`
      : `Eres un asistente legal experto en legislacion hondurena. El usuario esta consultando el documento: "${documentName}".

REGLA CRITICA: No se encontraron articulos especificos para esta consulta en la base de datos. NO inventes numeros de articulos. Si no tienes certeza del numero exacto de un articulo, responde con tu conocimiento general pero aclara que el usuario debe verificar el articulo especifico directamente en el documento.`;

    const anthropicMessages = [
      ...history.slice(-8).map((h) => ({
        role: h.role === "model" ? "assistant" : "user",
        content: h.text,
      })),
      { role: "user", content: message },
    ];

    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        temperature: 0.1,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("[chat/legal] Anthropic error:", errText);
      return NextResponse.json({ error: "Error al contactar IA" }, { status: 500 });
    }

    const anthropicData = await anthropicRes.json();
    const reply = anthropicData.content?.[0]?.text?.trim() ?? "";

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
    console.error("[chat/legal] ERROR:", String(err));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
