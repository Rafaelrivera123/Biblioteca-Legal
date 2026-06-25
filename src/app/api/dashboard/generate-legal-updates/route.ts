import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "Se requiere la URL del PDF" }, { status: 400 });
  }

  // Descargar el PDF desde EdgeStore y convertir a base64
  const pdfResponse = await fetch(url);
  if (!pdfResponse.ok) {
    return NextResponse.json({ error: "No se pudo descargar el PDF" }, { status: 400 });
  }
  const pdfBuffer = await pdfResponse.arrayBuffer();
  const base64 = Buffer.from(pdfBuffer).toString("base64");

  // Llamar a Claude con el PDF como documento nativo
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          } as any,
          {
            type: "text",
            text: `Eres un experto en derecho hondureño. Analiza esta Gaceta Oficial de Honduras e identifica entre 5 y 10 actualizaciones legales relevantes.

Para cada actualización extrae:
- title: título descriptivo claro (ej: "Reforma al Artículo 99 de la Ley de Tránsito")
- summary: resumen de 1-2 oraciones para abogados y ciudadanos
- content: explicación detallada en HTML de MÍNIMO 600 palabras usando etiquetas <p> y <strong>. Incluye: contexto de la ley reformada, qué artículo(s) cambiaron, el texto exacto del decreto si está disponible, implicaciones prácticas para ciudadanos y abogados, y cualquier detalle relevante.
- type: "REFORM" si modifica una ley existente, "NEW_LAW" si crea una nueva ley, "REPEAL" si deroga algo
- gacetaNumber: número de La Gaceta si aparece (solo el número, ej: "37,169")
- legalSource: número de decreto y artículo (ej: "Decreto 31-2026, Art. 99")

Responde ÚNICAMENTE con un array JSON válido, sin texto adicional, sin markdown, sin bloques de código:
[{"title":"...","summary":"...","content":"...","type":"REFORM","gacetaNumber":"...","legalSource":"..."}]`,
          },
        ],
      },
    ],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text : "";

  let updates: any[] = [];
  try {
    // Limpiar por si Claude agrega markdown
    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    updates = JSON.parse(cleaned);
    if (!Array.isArray(updates)) updates = [];
  } catch {
    return NextResponse.json({ error: "La IA devolvió una respuesta inesperada" }, { status: 500 });
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No se identificaron actualizaciones en este PDF" }, { status: 422 });
  }

  const created = [];
  for (const update of updates.slice(0, 10)) {
    if (!update.title || !update.summary || !update.content || !update.type) continue;

    const baseSlug = slugify(update.title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.legalUpdatePost.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const post = await prisma.legalUpdatePost.create({
      data: {
        title: update.title,
        slug,
        summary: update.summary,
        content: update.content,
        type: update.type,
        gacetaNumber: update.gacetaNumber || null,
        legalSource: update.legalSource || null,
        status: "draft",
      },
    });
    created.push(post.id);
  }

  return NextResponse.json({ created: created.length });
}
