import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = 20;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

async function getRelevantArticles(query: string): Promise<string> {
  try {
    type ArticleRaw = {
      articleNumber: number;
      articleLabel: string | null;
      contentPlainText: string;
      documentName: string;
      documentId: string;
    };

    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5);

    if (words.length === 0) return "";

    const conditions = words
      .map((_, i) => `a."contentPlainText" ILIKE $${i + 1}`)
      .join(" OR ");

    const params: unknown[] = words.map((w) => `%${w}%`);

    // Fetch more results and limit per document in JS
    const articles = await prisma.$queryRawUnsafe<ArticleRaw[]>(
      `SELECT a."articleNumber", a."articleLabel", a."contentPlainText", d."name" as "documentName", d."id" as "documentId"
       FROM "Article" a
       JOIN "Chapter" c ON a."chapterId" = c.id
       JOIN "Section" s ON c."sectionId" = s.id
       JOIN "Document" d ON s."documentId" = d.id
       WHERE ${conditions}
       ORDER BY d."viewCount" DESC
       LIMIT 50`,
      ...params
    );

    if (articles.length === 0) return "";

    // Max 2 articles per document to avoid one document monopolizing results
    const countPerDoc: Record<string, number> = {};
    const filtered = articles.filter((a) => {
      const count = countPerDoc[a.documentId] ?? 0;
      if (count >= 2) return false;
      countPerDoc[a.documentId] = count + 1;
      return true;
    });

    return filtered
      .slice(0, 10)
      .map((a) => {
        const label = a.articleLabel ?? String(a.articleNumber);
        return `[${a.documentName}] Articulo ${label}: ${a.contentPlainText}`;
      })
      .join("\n\n");
  } catch (err) {
    console.error("[legal-ai] getRelevantArticles error:", err);
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

    const relevantArticles = message ? await getRelevantArticles(message) : "";

    const systemPrompt = `Eres un asistente legal de Biblioteca Legal HN. Tu unica funcion es localizar y transcribir articulos de la legislacion hondurena.

REGLAS ABSOLUTAS:
- NUNCA interpretes, expliques, ni elabores sobre el contenido de ningun articulo.
- NUNCA agregues opinion, contexto, ni comentario propio.
- NUNCA inventes ni supongas el contenido o numero de un articulo.
- Si el usuario pregunta por un tema, localiza el articulo exacto y transcribelo literalmente, indicando de que documento proviene.
- Si el usuario pregunta por un numero de articulo especifico, transcribelo literalmente si esta en los resultados.
- Si no encuentras el articulo en los resultados disponibles, responde exactamente: "No encontre ese articulo en los resultados disponibles. Te recomiendo buscarlo directamente en el documento correspondiente en Biblioteca Legal HN."
- No agregues frases como "es importante destacar", "cabe mencionar", "en este sentido", ni ninguna elaboracion propia.

FORMATO DE RESPUESTA:
[Nombre del documento] - Articulo [numero]: [texto literal del articulo, sin modificaciones]

${
  relevantArticles
    ? `ARTICULOS ENCONTRADOS EN LA BASE DE DATOS:\n\n${relevantArticles}`
    : "No se encontraron articulos para esta consulta. Informa al usuario que no encontraste resultados y que busque directamente en Biblioteca Legal HN."
}`;

    const anthropicMessages: object[] = [
      ...history.slice(-8).map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.text,
      })),
    ];

    if (file) {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";

      if (isImage) {
        const base64 = await fileToBase64(file);
        anthropicMessages.push({
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: file.type, data: base64 },
            },
            {
              type: "text",
              text: message || "Identifica que articulos de la legislacion hondurena aplican a esta imagen.",
            },
          ],
        });
      } else if (isPdf) {
        const base64 = await fileToBase64(file);
        anthropicMessages.push({
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            {
              type: "text",
              text: message || "Identifica que articulos de la legislacion hondurena aplican a este documento.",
            },
          ],
        });
      } else {
        anthropicMessages.push({
          role: "user",
          content: `${message || "Analiza este documento"} (Archivo: ${file.name})`,
        });
      }
    } else {
      anthropicMessages.push({ role: "user", content: message });
    }

    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        temperature: 0,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("[legal-ai] Anthropic error:", errText);
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
    console.error("[legal-ai] ERROR:", String(err));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
