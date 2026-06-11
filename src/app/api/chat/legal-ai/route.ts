import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = 20;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent`;

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function extractLegalKeywords(query: string): Promise<string[]> {
  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `Eres un extractor de terminos juridicos hondurenos. Tu tarea es analizar cualquier tipo de consulta legal (penal, civil, administrativa, constitucional, laboral, familiar, mercantil, etc.) y extraer los terminos exactos que aparecerian dentro del texto de los articulos de ley hondurenos relevantes al caso.
Devuelve UNICAMENTE los terminos separados por comas. Sin explicacion, sin numeracion, sin puntos al final.
Ejemplos:
Consulta: "un maestro tuvo relaciones con una estudiante de 11 años" → violacion, abuso sexual, menor de edad, indemnidad sexual, docente, consentimiento
Consulta: "me despidieron sin previo aviso despues de 5 años" → despido injustificado, preaviso, indemnizacion, contrato de trabajo, auxilio de cesantia
Consulta: "la municipalidad nego mi permiso sin explicar por que" → acto administrativo, nulidad, motivacion, recurso de reposicion, procedimiento administrativo
Consulta: "quiero disolver mi sociedad anonima" → disolucion, sociedad anonima, liquidacion, junta de socios, patrimonio social`
          }]
        },
        contents: [{ role: "user", parts: [{ text: query }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 150 },
      }),
    });

    if (!res.ok) {
      console.error("[legal-ai] extractLegalKeywords Gemini error:", res.status);
      // Fallback: extract keywords using Groq
      return await extractLegalKeywordsGroq(query);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    if (!text) return await extractLegalKeywordsGroq(query);

    const keywords = text
      .split(",")
      .map((k: string) => normalize(k))
      .filter((k: string) => k.length > 2)
      .slice(0, 10);

    console.log("[legal-ai] extracted keywords (Gemini):", keywords);
    return keywords;
  } catch (err) {
    console.error("[legal-ai] extractLegalKeywords Gemini error:", err);
    return await extractLegalKeywordsGroq(query);
  }
}

async function extractLegalKeywordsGroq(query: string): Promise<string[]> {
  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Eres un extractor de terminos juridicos hondurenos. Tu tarea es analizar cualquier tipo de consulta legal (penal, civil, administrativa, constitucional, laboral, familiar, mercantil, etc.) y extraer los terminos exactos que aparecerian dentro del texto de los articulos de ley hondurenos relevantes al caso.
Devuelve UNICAMENTE los terminos separados por comas. Sin explicacion, sin numeracion, sin puntos al final.
Ejemplos:
Consulta: "un maestro tuvo relaciones con una estudiante de 11 años" → violacion, abuso sexual, menor de edad, indemnidad sexual, docente, consentimiento
Consulta: "me despidieron sin previo aviso despues de 5 años" → despido injustificado, preaviso, indemnizacion, contrato de trabajo, auxilio de cesantia
Consulta: "la municipalidad nego mi permiso sin explicar por que" → acto administrativo, nulidad, motivacion, recurso de reposicion, procedimiento administrativo
Consulta: "quiero disolver mi sociedad anonima" → disolucion, sociedad anonima, liquidacion, junta de socios, patrimonio social`,
          },
          { role: "user", content: query },
        ],
        max_tokens: 150,
        temperature: 0,
      }),
    });

    if (!res.ok) {
      console.error("[legal-ai] extractLegalKeywordsGroq error:", res.status);
      return [];
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (!text) return [];

    const keywords = text
      .split(",")
      .map((k: string) => normalize(k))
      .filter((k: string) => k.length > 2)
      .slice(0, 10);

    console.log("[legal-ai] extracted keywords (Groq fallback):", keywords);
    return keywords;
  } catch (err) {
    console.error("[legal-ai] extractLegalKeywordsGroq error:", err);
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

    const keywords = await extractLegalKeywords(query);
    console.log("[legal-ai] keywords for RAG:", keywords);

    if (keywords.length === 0) {
      console.error("[legal-ai] no keywords extracted, RAG skipped");
      return "";
    }

    const conditions = keywords
      .map((_, i) => `unaccent(a."contentPlainText") ILIKE $${i + 1}`)
      .join(" OR ");

    const scoreExpressions = keywords
      .map((_, i) => `(CASE WHEN unaccent(a."contentPlainText") ILIKE $${keywords.length + i + 1} THEN 1 ELSE 0 END)`)
      .join(" + ");

    const params: unknown[] = [
      ...keywords.map((w) => `%${w}%`),
      ...keywords.map((w) => `%${w}%`),
    ];

    const articles = await prisma.$queryRawUnsafe<ArticleRaw[]>(
      `SELECT a."articleNumber", a."articleLabel", a."contentPlainText", d."name" as "documentName",
              (${scoreExpressions}) as score
       FROM "Article" a
       JOIN "Chapter" c ON a."chapterId" = c.id
       JOIN "Section" s ON c."sectionId" = s.id
       JOIN "Document" d ON s."documentId" = d.id
       WHERE ${conditions}
       ORDER BY score DESC
       LIMIT 15`,
      ...params
    );

    console.log("[legal-ai] articles found:", articles.length, articles.map((a) => `${a.documentName} art.${a.articleNumber}`));

    if (articles.length === 0) return "";

    return articles
      .map((a) => {
        const label = a.articleLabel ?? String(a.articleNumber);
        return `[${a.documentName}] Articulo ${label}: ${a.contentPlainText}`;
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

    const relevantArticles = message ? await getRelevantArticles(message) : "";
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
[Nombre del documento] - Articulo [numero]: [texto literal]
[repetir por cada articulo relevante]

**Conclusion:**
[Lo que se desprende directamente de los articulos citados, sin agregar nada mas]

${
  relevantArticles
    ? `ARTICULOS ENCONTRADOS EN LA BASE DE DATOS:\n\n${relevantArticles}`
    : "No se encontraron articulos para esta consulta. Informa al usuario que no encontraste resultados y que consulte directamente los documentos en Biblioteca Legal HN."
}`;

    // Build messages for Groq
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
          ? "llama-3.2-11b-vision-preview"
          : "llama-3.3-70b-versatile",
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
