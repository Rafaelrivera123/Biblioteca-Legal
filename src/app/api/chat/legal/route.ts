import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = 20;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function getRelevantArticles(documentId: string, query: string): Promise<string> {
  try {
    // Busca artículos cuyo texto contenga palabras clave de la pregunta
    const keywords = query
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(" ")
      .filter((w) => w.length > 3)
      .slice(0, 5);

    if (keywords.length === 0) return "";

    const articles = await prisma.$queryRaw
      { articleNumber: number; articleLabel: string | null; content: string }[]
    >`
      SELECT a."articleNumber", a."articleLabel", a."contentPlainText" as content
      FROM "Article" a
      JOIN "Chapter" c ON a."chapterId" = c.id
      JOIN "Section" s ON c."sectionId" = s.id
      WHERE s."documentId" = ${documentId}
      AND (
        ${keywords.map((k) => `a."contentPlainText" ILIKE '%${k}%'`).join(" OR ")}
      )
      LIMIT 5
    `;

    if (articles.length === 0) return "";

    return articles
      .map((a) => {
        const label = a.articleLabel ?? String(a.articleNumber);
        return `Artículo ${label}: ${a.content}`;
      })
      .join("\n\n");
  } catch {
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

    // Buscar artículos relevantes en la DB
    const relevantArticles = documentId
      ? await getRelevantArticles(documentId, message)
      : "";

    const systemContent = relevantArticles
      ? `Eres un asistente legal especializado en legislación hondureña. El usuario está consultando el documento: "${documentName}".

ARTÍCULOS RELEVANTES DEL DOCUMENTO:
${relevantArticles}

Responde basándote en los artículos anteriores cuando sean relevantes. Si la pregunta no está cubierta por esos artículos, responde con tu conocimiento general de la legislación hondureña. Responde siempre en español de forma clara y concisa.`
      : `Ere
