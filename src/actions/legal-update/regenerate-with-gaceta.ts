"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
interface ChangeData {
  gacetaNumber: string;
  articleLabel: string;
  before: string;
  after: string;
}
function buildReformTable(changes: ChangeData[]): string {
  const rows = changes
    .map(
      (c) => `
              <tr>
                <td style="border: 1px solid #333; padding: 8px; color: #ffffff;">${c.gacetaNumber}</td>
                <td style="border: 1px solid #333; padding: 8px; color: #ffffff;">${c.articleLabel}</td>
                <td style="border: 1px solid #333; padding: 8px; color: #ffffff;">${c.before}</td>
                <td style="border: 1px solid #333; padding: 8px; color: #ffffff;">${c.after}</td>
              </tr>`
    )
    .join("");
  return `
            <table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #4CAF50; margin: 15px 0; background-color: #111122; font-size: 14px; border-collapse: collapse;">
              <tr>
                <th style="border: 1px solid #333; padding: 8px; color: #4CAF50; text-align: left;">N° Gaceta</th>
                <th style="border: 1px solid #333; padding: 8px; color: #4CAF50; text-align: left;">Art.</th>
                <th style="border: 1px solid #333; padding: 8px; color: #4CAF50; text-align: left;">[ANTES] Estado Previo / Texto Anterior</th>
                <th style="border: 1px solid #333; padding: 8px; color: #4CAF50; text-align: left;">[DESPUÉS] Disposición Nueva / Texto Reformado</th>
              </tr>${rows}
            </table>`;
}
function extractArticleNumberFromLabel(label: string): number | null {
  const match = label.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}
export async function regenerateReformWithGaceta(postId: string, gacetaText: string) {
  try {
    const cu = await auth();
    if (!cu || cu.user.role !== "admin") {
      return { success: false, message: "Unauthorized access." };
    }
    const post = await prisma.legalUpdatePost.findUnique({
      where: { id: postId },
    });
    if (!post) {
      return { success: false, message: "Actualización no encontrada." };
    }
    if (post.type !== "REFORM") {
      return { success: false, message: "Solo aplica a posts de tipo Reforma." };
    }
    if (!post.relatedDocumentId) {
      return {
        success: false,
        message: "Esta actualización no tiene un documento relacionado en la biblioteca.",
      };
    }
    const changes = (post.changesData as unknown as ChangeData[] | null) ?? [];
    if (changes.length === 0) {
      return { success: false, message: "No hay cambios registrados para esta actualización." };
    }
    const updatedChanges: ChangeData[] = [];
    for (const change of changes) {
      const articleNumber = extractArticleNumberFromLabel(change.articleLabel);
      let currentArticleText = "";
      if (articleNumber !== null) {
        const article = await prisma.article.findFirst({
          where: {
            chapter: {
              section: {
                documentId: post.relatedDocumentId,
              },
            },
            OR: [
              { articleNumber },
              { articleLabel: change.articleLabel },
            ],
          },
          select: { contentPlainText: true },
        });
        currentArticleText = article?.contentPlainText?.trim() ?? "";
      }
      if (!currentArticleText) {
        // No encontramos el artículo actual; dejamos el change sin modificar.
        updatedChanges.push(change);
        continue;
      }
      const gacetaExcerpt = gacetaText.slice(0, 12000);
      const openaiRes = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 1500,
          temperature: 0.0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Eres un auditor legislativo experto en legislación hondureña.
Recibirás el TEXTO ACTUAL de un artículo (tal como está vigente en la biblioteca) y el TEXTO DE LA GACETA (publicación oficial que contiene la reforma).
Tu tarea es identificar, dentro del texto de la Gaceta, la nueva redacción del artículo indicado, y devolver tanto el texto actual ("before") como el texto reformado ("after").
REGLAS ABSOLUTAS:
- "before" debe ser el TEXTO ACTUAL proporcionado, transcrito literalmente (puedes resumir si es muy largo, pero sin cambiar su sentido).
- "after" debe ser el texto reformado EXACTO según la Gaceta. Si la Gaceta no contiene la redacción completa del artículo reformado, describe textualmente solo lo que la Gaceta dice que cambia, sin inventar el resto.
- Si no encuentras ninguna referencia al artículo indicado en el texto de la Gaceta, responde con "after": "No se encontró la reforma de este artículo en el PDF proporcionado." y "before" igual al texto actual.
- Responde EXCLUSIVAMENTE con un objeto JSON: { "before": string, "after": string }. Sin texto adicional, sin markdown.`,
            },
            {
              role: "user",
              content: `ARTÍCULO A BUSCAR: ${change.articleLabel}
TEXTO ACTUAL (vigente en la biblioteca):
${currentArticleText}
TEXTO DE LA GACETA (fuente de la reforma):
${gacetaExcerpt}`,
            },
          ],
        }),
      });
      if (!openaiRes.ok) {
        updatedChanges.push(change);
        continue;
      }
      const openaiData = await openaiRes.json();
      const rawContent = openaiData.choices?.[0]?.message?.content?.trim() ?? "";
      try {
        const parsed = JSON.parse(rawContent);
        updatedChanges.push({
          gacetaNumber: change.gacetaNumber,
          articleLabel: change.articleLabel,
          before: typeof parsed.before === "string" ? parsed.before : currentArticleText,
          after: typeof parsed.after === "string" ? parsed.after : change.after,
        });
      } catch {
        updatedChanges.push(change);
      }
    }
    // Reconstruir el content reemplazando solo la tabla, conservando el resto del HTML.
    const tableRegex = /<table[\s\S]*?<\/table>/;
    const newTable = buildReformTable(updatedChanges);
    let newContent: string;
    if (tableRegex.test(post.content)) {
      newContent = post.content.replace(tableRegex, newTable);
    } else {
      newContent = `${post.content}\n${newTable}`;
    }
    await prisma.legalUpdatePost.update({
      where: { id: postId },
      data: {
        content: newContent,
        changesData: updatedChanges as unknown as object,
      },
    });
    revalidatePath("/dashboard/legal-updates");
    revalidatePath("/actualizaciones");
    revalidatePath(`/actualizaciones/${post.slug}`);
    return {
      success: true,
      message: `Se regeneraron ${updatedChanges.length} cambio(s) usando la Gaceta proporcionada.`,
    };
  } catch (error) {
    console.error("Failed to regenerate reform with gaceta:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    };
  }
}
