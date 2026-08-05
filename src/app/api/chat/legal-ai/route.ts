import { auth } from "@/auth";
import { isSubscribed } from "@/helper/subscription";
import { prisma } from "@/lib/db";
import {
  CHAT_HISTORY_TURNS,
  FREE_AI_CHAT_LIMIT,
  fileToBase64,
  getDocumentScopedArticles,
  getGlobalRelevantArticles,
  GROQ_API_URL,
  GROQ_TEXT_MODEL,
  GROQ_VISION_MODEL,
} from "@/lib/legal-chat";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleLegalChat(req);
}

async function handleLegalChat(req: NextRequest) {
  try {
    const cu = await auth();
    const isLoggedin = !!cu?.user?.id;
    const userId = cu?.user?.id ?? null;
    let isAdmin = false;
    let hasSubscription = false;
    let freeChatUsed = 0;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, freeChatUsed: true },
      });
      isAdmin = user?.role === "admin";
      freeChatUsed = user?.freeChatUsed ?? 0;
      hasSubscription = isAdmin || (await isSubscribed());
    }

    const contentType = req.headers.get("content-type") ?? "";
    let message = "";
    let history: { role: string; text: string }[] = [];
    let file: File | null = null;
    let documentId: string | undefined;
    let documentName: string | undefined;
    let scoped = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      message = (formData.get("message") as string) ?? "";
      history = JSON.parse((formData.get("history") as string) ?? "[]");
      file = formData.get("file") as File | null;
      documentId = (formData.get("documentId") as string) || undefined;
      documentName = (formData.get("documentName") as string) || undefined;
      scoped = formData.get("scoped") === "true";
    } else {
      const body = await req.json().catch(() => ({}));
      message = body.message ?? "";
      history = body.history ?? [];
      documentId = body.documentId;
      documentName = body.documentName;
      scoped = !!body.scoped;
    }

    const usingFreeQuota = !hasSubscription;

    if (!isLoggedin) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (scoped) {
      if (!message?.trim() || !documentName) {
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
      }
    } else if (!message?.trim() && !file) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (usingFreeQuota) {
      if (freeChatUsed >= FREE_AI_CHAT_LIMIT) {
        return NextResponse.json(
          {
            error: "Cuota gratuita agotada",
            freeQuotaExhausted: true,
            remaining: 0,
          },
          { status: 403 }
        );
      }
      // Global free chat is text-only (no file uploads) to control cost.
      if (!scoped && file) {
        return NextResponse.json(
          { error: "Subir archivos requiere Plan Personal", freeQuotaExhausted: true },
          { status: 403 }
        );
      }
    }

    const today = new Date().toISOString().split("T")[0];

    const relevantArticles = scoped
      ? documentId
        ? await getDocumentScopedArticles(documentId, message)
        : ""
      : message
        ? await getGlobalRelevantArticles(message, history)
        : "";

    const systemPrompt = scoped
      ? buildDocumentSystemPrompt(documentName!, relevantArticles)
      : buildGlobalSystemPrompt(relevantArticles);

    const groqMessages: object[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-CHAT_HISTORY_TURNS).map((h) => ({
        role: h.role === "model" || h.role === "assistant" ? "assistant" : "user",
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
              text:
                message ||
                "Identifica que articulos de la legislacion hondurena aplican a esta imagen.",
            },
          ],
        });
      } else {
        groqMessages.push({
          role: "user",
          content: message || `Analiza este documento: ${file.name}`,
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
        model: file?.type.startsWith("image/") ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL,
        messages: groqMessages,
        max_tokens: scoped ? 1200 : 1500,
        temperature: 0,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[legal-chat] Groq error:", errText);
      return NextResponse.json({ error: "Error al contactar IA" }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const reply = groqData.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) {
      return NextResponse.json({ error: "Sin respuesta de IA" }, { status: 500 });
    }

    let remaining: number | null = null;

    if (isAdmin) {
      remaining = null;
    } else if (usingFreeQuota && userId) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { freeChatUsed: { increment: 1 } },
        select: { freeChatUsed: true },
      });
      remaining = Math.max(0, FREE_AI_CHAT_LIMIT - updated.freeChatUsed);
    } else if (hasSubscription && userId) {
      // Track usage for analytics only — no daily hard cap for subscribers.
      await prisma.chatUsage.upsert({
        where: { userId_date: { userId, date: today } },
        update: { count: { increment: 1 } },
        create: { userId, date: today, count: 1 },
      });
      remaining = null;
    }

    return NextResponse.json({
      reply,
      remaining,
      freeQuota: usingFreeQuota,
      freeQuotaLimit: usingFreeQuota ? FREE_AI_CHAT_LIMIT : undefined,
    });
  } catch (err) {
    console.error("[legal-chat] ERROR:", String(err));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function buildDocumentSystemPrompt(documentName: string, relevantArticles: string) {
  return relevantArticles
    ? `Eres un asistente legal especializado en "${documentName}".
TU FUNCION:
Analizar casos practicos y preguntas legales utilizando exclusivamente los articulos de "${documentName}" como fundamento.
REGLAS ABSOLUTAS:
- NUNCA inventes numeros de articulos ni contenido.
- Si los articulos disponibles no cubren el caso completamente, indicalo claramente.
ARTICULOS ENCONTRADOS EN "${documentName}":
${relevantArticles}`
    : `Eres un asistente legal especializado en "${documentName}".
No se encontraron articulos para esta consulta. Informa al usuario que no encontraste articulos relacionados.`;
}

function buildGlobalSystemPrompt(relevantArticles: string) {
  return `Eres un asistente legal de Biblioteca Legal HN especializado en legislacion hondurena.
REGLAS ABSOLUTAS:
- NUNCA inventes numeros de articulos ni contenido.
- Si los articulos disponibles no cubren el caso completamente, indicalo claramente.
${
  relevantArticles
    ? `ARTICULOS ENCONTRADOS EN LA BASE DE DATOS:\n\n${relevantArticles}`
    : "No se encontraron articulos para esta consulta."
}`;
}

export { handleLegalChat };
