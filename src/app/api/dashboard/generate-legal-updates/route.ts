import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { backendClient } from "@/lib/edgestore-server";
import Anthropic from "@anthropic-ai/sdk";

// IMPORTANTE: esta app está en Vercel Hobby, que tiene un tope DURO de 60
// segundos por función serverless (Vercel corta la ejecución ahí, sin
// importar lo que digamos acá). Antes decía 300, que ya estaba mal para
// este plan. Si en algún momento subís a Pro (300s) o Enterprise (900s),
// subí este número también.
export const maxDuration = 60;

// claude-sonnet-5 tiene ventana de contexto de 1M tokens (vs. 200k de
// claude-sonnet-4-5), lo que nos deja subir el límite de caracteres de la
// Gaceta sin que Anthropic la rechace por exceder el contexto.
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

  try {
    // Descargar el PDF desde EdgeStore. Timeout corto (15s) porque en Hobby
    // solo tenemos 60s en total para todo el proceso, y la mayor parte del
    // presupuesto de tiempo tiene que quedar para la llamada a la IA.
    let pdfBuffer: ArrayBuffer;
    try {
      const pdfResponse = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!pdfResponse.ok) {
        return NextResponse.json({ error: "No se pudo descargar el PDF" }, { status: 400 });
      }
      pdfBuffer = await pdfResponse.arrayBuffer();
    } catch (err: any) {
      const msg = err?.name === "TimeoutError" || err?.name === "AbortError"
        ? "Tiempo de espera agotado al descargar el PDF"
        : "Error al descargar el PDF";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    // Extraemos el texto del PDF en vez de mandarlo como documento nativo:
    // Claude convierte cada página de un PDF en imágenes internamente, lo que
    // dispara el conteo de tokens en Gacetas largas (por eso fallaba con
    // "prompt is too long"). El texto plano es muchísimo más barato en tokens.
    // Nota: en Gacetas de dos columnas el orden del texto puede salir un poco
    // desordenado (pdf-parse no distingue columnas); para esos casos revisa el
    // resultado antes de publicar.
    let pdfText: string;
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(Buffer.from(pdfBuffer));
      pdfText = data.text?.trim() ?? "";
    } catch (err: any) {
      return NextResponse.json(
        { error: `No se pudo extraer el texto del PDF: ${err?.message ?? "desconocido"}` },
        { status: 400 }
      );
    }
    if (!pdfText) {
      return NextResponse.json({ error: "No se pudo extraer texto del PDF" }, { status: 400 });
    }

    // Límite de caracteres de entrada. Con claude-sonnet-5 (1M tokens de
    // contexto) esto ya no es el cuello de botella real — lo triplicamos
    // respecto al límite anterior (600,000 → 1,800,000) porque el modelo
    // puede con Gacetas mucho más grandes sin problema de contexto.
    // El verdadero límite ahora es el tiempo (60s totales en Hobby), no el
    // tamaño del documento.
    const MAX_CHARS = 1_800_000;
    if (pdfText.length > MAX_CHARS) {
      return NextResponse.json(
        {
          error: `Esta Gaceta es demasiado larga para procesarla de una vez (${pdfText.length.toLocaleString()} caracteres). Divide el PDF en partes más pequeñas y súbelas por separado.`,
        },
        { status: 413 }
      );
    }

    // Llamar a Claude con el texto extraído del PDF.
    // Pedimos MENOS actualizaciones (1 a 3 en vez de 5 a 10) pero CADA UNA
    // el doble de detallada (mínimo 1200 palabras en vez de 600). Es un
    // trade-off deliberado: en Vercel Hobby solo tenemos 60s en total, y
    // generar contenido más largo para muchas actualizaciones a la vez no
    // entra en ese tiempo. Si necesitás más de 3 actualizaciones por Gaceta,
    // corré "Generar con IA" varias veces, o subí a Vercel Pro/Enterprise
    // para poder subir maxDuration y este rango de nuevo.
    let response;
    try {
      response = await anthropic.messages.create(
        {
          model: "claude-sonnet-5",
          max_tokens: 8000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Texto de la Gaceta Oficial (extraído del PDF):\n\n${pdfText}`,
                },
                {
                  type: "text",
                  text: `Eres un experto en derecho hondureño. Analiza esta Gaceta Oficial de Honduras e identifica entre 1 y 3 actualizaciones legales más relevantes (prioriza las más importantes, no todas las que encuentres).

Para cada actualización extrae:
- title: título descriptivo claro (ej: "Reforma al Artículo 99 de la Ley de Tránsito")
- summary: resumen de 1-2 oraciones para abogados y ciudadanos
- content: explicación detallada en HTML de MÍNIMO 1200 palabras usando etiquetas <p> y <strong>. Incluye: contexto de la ley reformada, qué artículo(s) cambiaron, el texto exacto del decreto si está disponible, implicaciones prácticas para ciudadanos y abogados, antecedentes relevantes, y cualquier detalle adicional que ayude a entender el impacto del cambio.
- type: "REFORM" si modifica una ley existente, "NEW_LAW" si crea una nueva ley, "REPEAL" si deroga algo
- gacetaNumber: número de La Gaceta si aparece (solo el número, ej: "37,169")
- legalSource: número de decreto y artículo (ej: "Decreto 31-2026, Art. 99")

Responde ÚNICAMENTE con un array JSON válido, sin texto adicional, sin markdown, sin bloques de código:
[{"title":"...","summary":"...","content":"...","type":"REFORM","gacetaNumber":"...","legalSource":"..."}]`,
                },
              ],
            },
          ],
        },
        { timeout: 35_000 }
      );
    } catch (err: any) {
      return NextResponse.json(
        { error: `Error al llamar a la IA: ${err?.message ?? "desconocido"}` },
        { status: 502 }
      );
    }

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
    for (const update of updates.slice(0, 3)) {
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
  } finally {
    // El PDF de la Gaceta ya cumplió su función (se le extrajo el texto).
    // Lo borramos de EdgeStore sin importar si el procesamiento tuvo éxito
    // o falló, para no dejar archivos huérfanos ocupando storage.
    try {
      await backendClient.publicFiles.deleteFile({ url });
    } catch (err) {
      console.error("No se pudo borrar el PDF de EdgeStore:", url, err);
    }
  }
}
