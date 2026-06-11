import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = 20;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

async function extractLegalKeywords(query: string): Promise<string[]> {
  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        temperature: 0,
        system: `Eres un extractor de terminos juridicos hondurenos. Dado un texto, devuelve UNICAMENTE una lista de terminos legales en espanol separados por comas, sin explicacion, sin puntos, sin frases. Solo los terminos. Ejemplos de terminos: violacion, abuso sexual, menor de edad, homicidio, hurto, fraude, apropiacion indebida, nulidad, acto administrativo, competencia, contrato, despido, preaviso, pension, sociedad anonima, quiebra.`,
        messages: [{ role: "user", content: query }],
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() ?? "";
    return text
      .split(",")
      .map((k: string) => k.trim().toLowerCase())
      .filter((k: string) => k.length > 2)
      .slice(0, 8);
  } catch {
    return [];
  }
}

async function getRelevantArticles(query: string): Promise<string> {
  try {
    type ArticleRaw = {
      articleNumber: number;
      articleLabel: string | null;
      contentPlainText: string;
      documentName: string;
    };

    const aiKeywords = await extractLegalKeywords(query);

    const rawWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5);

    const allKeywords = Array.from(new Set([...aiKeywords, ...rawWords])).slice(0, 10);

    if (allKeywords.length === 0) return "";

    const conditions = allKeywords
      .map((_, i) => `a."contentPlainText" ILIKE $${i + 1}`)
      .join(" OR ");

    const params: unknown[] = allKeywords.map((w) => `%${w}%`);

    const articles = await prisma.$queryRawUnsafe<ArticleRaw[]>(
      `SELECT a."articleNumber", a."articleLabel", a."contentPlainText", d."name" as "documentName"
       FROM "Article" a
       JOIN "Chapter" c ON a."chapterId" = c.id
       JOIN "Section" s ON c."sectionId" = s.id
       JOIN "Document" d ON s."documentId" = d.id
       WHERE ${conditions}
       LIMIT 15`,
      ...params
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

    const systemPrompt = `Eres un asistente legal de Biblioteca Legal HN especializado en legislacion hondurena.

TU FUNCION:
Analizar casos practicos y preguntas legales utilizando exclusivamente los articulos de la legislacion hondurena como fundamento. No eres un interprete de la ley, eres un analizador que conecta los hechos del caso con lo que la ley dice textualmente.

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
[Nombre del documento] - Articulo [numero]: [texto literal]
[repetir por cada articulo relevante]

**Conclusion:**
[Lo que se desprende directamente de los articulos citados, sin agregar nada mas]

${
  relevantArticles
    ? `ARTICULOS ENCONTRADOS EN LA BASE DE DATOS:\n\n${relevantArticles}`
    : "No se encontraron articulos para esta consulta. Informa al usuario que no encontraste resultados y que consulte directamente los documentos en Biblioteca Legal HN."
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
