import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { backendClient } from "@/lib/edgestore-server";
import Anthropic from "@anthropic-ai/sdk";

// Con Fluid Compute (activado por defecto en Vercel), el plan Hobby permite
// hasta 300 segundos de duración máxima — no 60. (Corregido: antes decía 60
// acá por una suposición desactualizada sobre los límites de Hobby, y eso
// fue lo que causó el timeout real que viste, no el plan en sí).
export const maxDuration = 300;

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
    // Descargar el PDF desde EdgeStore (timeout de 30s para que no se quede
    // colgado si el archivo no responde).
    let pdfBuffer: ArrayBuffer;
    try {
      const pdfResponse = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!pdfResponse.ok) {
        console.error("[generate-legal-updates] descarga falló, status:", pdfResponse.status, url);
        return NextResponse.json({ error: "No se pudo descargar el PDF" }, { status: 400 });
      }
      pdfBuffer = await pdfResponse.arrayBuffer();
      console.log("[generate-legal-updates] PDF descargado, bytes:", pdfBuffer.byteLength);
    } catch (err: any) {
      const msg = err?.name === "TimeoutError" || err?.name === "AbortError"
        ? "Tiempo de espera agotado al descargar el PDF"
        : "Error al descargar el PDF";
      console.error("[generate-legal-updates] error descargando PDF:", err);
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
      console.log("[generate-legal-updates] texto extraído, caracteres:", pdfText.length, "páginas:", data.numpages);
    } catch (err: any) {
      console.error("[generate-legal-updates] error en pdf-parse:", err);
      return NextResponse.json(
        { error: `No se pudo extraer el texto del PDF: ${err?.message ?? "desconocido"}` },
        { status: 400 }
      );
    }
    if (!pdfText) {
      console.error("[generate-legal-updates] pdf-parse devolvió texto vacío");
      return NextResponse.json({ error: "No se pudo extraer texto del PDF" }, { status: 400 });
    }

    // Límite de caracteres de entrada. Con claude-sonnet-5 (1M tokens de
    // contexto) esto ya no es el cuello de botella real — lo triplicamos
    // respecto al límite anterior (600,000 → 1,800,000) porque el modelo
    // puede con Gacetas mucho más grandes sin problema de contexto, y con
    // Fluid Compute tenemos hasta 300s reales para procesarlas.
    const MAX_CHARS = 1_800_000;
    if (pdfText.length > MAX_CHARS) {
      console.error("[generate-legal-updates] texto excede MAX_CHARS:", pdfText.length);
      return NextResponse.json(
        {
          error: `Esta Gaceta es demasiado larga para procesarla de una vez (${pdfText.length.toLocaleString()} caracteres). Divide el PDF en partes más pequeñas y súbelas por separado.`,
        },
        { status: 413 }
      );
    }

    // Llamar a Claude con el texto extraído del PDF.
    // Cada actualización ahora tiene el doble de contenido (mínimo 1200
    // palabras en vez de 600), así que bajamos un poco el rango de cantidad
    // (3 a 6 en vez de 5 a 10) para no disparar el total de tokens de salida
    // más de lo razonable. Con los 300s reales que da Hobby (Fluid Compute)
    // esto entra cómodo.
    let response;
    try {
      response = await anthropic.messages.create(
        {
          model: "claude-sonnet-5",
          max_tokens: 20000,
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
                  text: `Eres un experto en derecho hondureño. Analiza esta Gaceta Oficial de Honduras e identifica entre 3 y 6 actualizaciones legales relevantes (prioriza las más importantes).

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
        { timeout: 250_000 }
      );
      console.log("[generate-legal-updates] respuesta de la IA recibida, stop_reason:", response.stop_reason, "tokens de salida:", response.usage?.output_tokens);
    } catch (err: any) {
      console.error("[generate-legal-updates] error llamando a la IA:", err?.status, err?.message, err);
      return NextResponse.json(
        { error: `Error al llamar a la IA: ${err?.message ?? "desconocido"}` },
        { status: 502 }
      );
    }

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    console.log("[generate-legal-updates] largo de la respuesta de texto:", rawText.length, "primeros 300 caracteres:", rawText.slice(0, 300));

    let updates: any[] = [];
    try {
      // Limpiar por si Claude agrega markdown
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      updates = JSON.parse(cleaned);
      if (!Array.isArray(updates)) updates = [];
    } catch (err) {
      console.error("[generate-legal-updates] no se pudo parsear el JSON de la IA:", err, "rawText:", rawText.slice(0, 1000));
      return NextResponse.json({ error: "La IA devolvió una respuesta inesperada" }, { status: 500 });
    }

    console.log("[generate-legal-updates] actualizaciones parseadas:", updates.length);

    if (updates.length === 0) {
      console.error("[generate-legal-updates] la IA devolvió un array vacío");
      return NextResponse.json({ error: "No se identificaron actualizaciones en este PDF" }, { status: 422 });
    }

    const created = [];
    for (const update of updates.slice(0, 6)) {
      if (!update.title || !update.summary || !update.content || !update.type) {
        console.error(
          "[generate-legal-updates] actualización descartada por campos faltantes:",
          {
            hasTitle: !!update.title,
            hasSummary: !!update.summary,
            hasContent: !!update.content,
            hasType: !!update.type,
            rawUpdate: update,
          }
        );
        continue;
      }

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

    console.log("[generate-legal-updates] borradores creados:", created.length, "de", updates.length, "identificados");

    return NextResponse.json({ created: created.length });
  } finally {
    // El PDF de la Gaceta ya cumplió su función (se le extrajo el texto).
    // Lo borramos de EdgeStore sin importar si el procesamiento tuvo éxito
    // o falló, para no dejar archivos huérfanos ocupando storage. (Además,
    // el upload en el modal ahora se marca como "temporary", así que aunque
    // este borrado no llegue a correr, EdgeStore lo limpia solo en 24h.)
    try {
      await backendClient.publicFiles.deleteFile({ url });
    } catch (err) {
      console.error("No se pudo borrar el PDF de EdgeStore:", url, err);
    }
  }
}
