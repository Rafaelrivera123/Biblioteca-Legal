import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.type !== "application/pdf") {
    return NextResponse.json({ error: "Se requiere un archivo PDF" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const pdfParse = (await import("pdf-parse")).default;
  const parsed = await pdfParse(buffer);
  const text = parsed.text.slice(0, 40000);

  if (text.trim().length < 100) {
    return NextResponse.json(
      { error: "No se pudo extraer texto del PDF. Asegúrate de que no sea un PDF de solo imágenes." },
      { status: 400 }
    );
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Eres un experto en derecho hondureño. Analiza el texto de La Gaceta Oficial de Honduras e identifica las actualizaciones legales más relevantes.

Para cada actualización extrae:
- title: título descriptivo claro (ej: "Reforma al Artículo 99 de la Ley de Tránsito")
- summary: resumen de 1-2 oraciones para abogados y ciudadanos
- content: explicación detallada en HTML usando etiquetas <p> y <strong>. Explica qué cambió, qué artículo, qué dice el texto reformado.
- type: "REFORM" si modifica una ley existente, "NEW_LAW" si crea una nueva ley, "REPEAL" si deroga algo
- gacetaNumber: número de La Gaceta si aparece (solo el número, ej: "37,169")
- legalSource: número de decreto y artículo (ej: "Decreto 31-2026, Art. 99")

Responde con JSON en este formato exacto:
{ "updates": [ { "title": "...", "summary": "...", "content": "...", "type": "REFORM", "gacetaNumber": "...", "legalSource": "..." } ] }`,
      },
      {
        role: "user",
        content: `Analiza el siguiente texto de La Gaceta e identifica entre 5 y 10 actualizaciones legales relevantes:\n\n${text}`,
      },
    ],
  });

  let updates: any[] = [];
  try {
    const result = JSON.parse(response.choices[0].message.content ?? "{}");
    updates = Array.isArray(result) ? result : (result.updates ?? []);
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
