import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = 20;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function getRelevantArticles(query: string): Promise<string> {
  try {
    const articles = await prisma.$queryRawUnsafe
      { articleNumber: number; articleLabel: string | null; contentPlainText: string; documentName: string }[]
    >(
      `SELECT a."articleNumber", a."articleLabel", a."contentPlainText", d."name" as "documentName"
       FROM "Article" a
       JOIN "Chapter" c ON a."chapterId" = c.id
       JOIN "Section" s ON c."sectionId" = s.id
       JOIN "Document" d ON s."documentId" = d.id
       WHERE a."contentPlainText" ILIKE $1
       ORDER BY d."viewCount" DESC
       LIMIT 5`,
      `%${query.slice(0, 50)}%`
    );

    if (articles.length === 0) return "";

    return articles
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
      message = formData.get("message") as string ?? "";
      const historyRaw = formData.get("history") as string ?? "[]";
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

    const relevantArticles = message
      ? await getRelevantArticles(message)
      : "";

    const systemContent = `Eres un asistente legal especializado en legislacion hondurena. Tienes acceso a la base de datos completa de Biblioteca Legal HN que contiene las leyes, codigos y decretos de Honduras.

${relevantArticles ? `ARTICULOS RELEVANTES ENCONTRADOS EN LA BASE DE DATOS:\n${relevantArticles}\n\nResponde basandote en estos articulos cuando sean relevantes.` : ""}

Responde siempre en espanol de forma clara y concisa. Si el usuario sube un documento o imagen, analiza su contenido en el contexto legal hondureno.`;

    let groqMessages: object[] = [
      { role: "system", content: systemContent },
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
            {
              type: "image_url",
              image_url: { url: `data:${file.type};base64,${base64}` },
            },
            {
              type: "text",
              text: message || "Analiza esta imagen en el contexto legal hondureno.",
            },
          ],
        });
      } else {
        groqMessages.push({
          role: "user",
          content: `${message || "Analiza este documento"} (Archivo: ${file.name})`,
        });
      }
    } else {
      groqMessages.push({ role: "user", content: message });
    }

    const model = file?.type.startsWith("image/")
      ? "llama-3.2-11b-vision-preview"
      : "llama-3.3-70b-versatile";

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: groqMessages,
        max_tokens: 800,
        temperature: 0.3,
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
