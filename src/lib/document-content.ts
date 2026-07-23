import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

/**
 * Trae las secciones -> capítulos -> artículos completos de un documento
 * (código/ley) para la página pública /collections/[id].
 *
 * Antes esta consulta (que trae el texto completo de TODOS los artículos
 * del documento) se ejecutaba directo contra Neon en cada visita, porque
 * la página es dinámica (usa auth()). Con el tráfico creciendo, eso disparó
 * el "public network transfer" (egress) de Neon.
 *
 * Con unstable_cache, el resultado se guarda en la Data Cache de Next.js
 * por documentId: mientras el revalidate no expire (10 min) o no se llame
 * revalidateTag(`document-${documentId}`), las siguientes visitas al mismo
 * documento se sirven desde la cache y no vuelven a pegarle a Postgres.
 */
export function getDocumentSections(documentId: string) {
  return unstable_cache(
    async () => {
      return prisma.section.findMany({
        where: { documentId },
        include: {
          chapters: {
            include: {
              articles: {
                orderBy: [
                  { articleNumber: "asc" as const },
                  { articleLabel: "asc" as const },
                ],
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    },
    [`document-sections-${documentId}`],
    {
      tags: [`document-${documentId}`],
      revalidate: 600,
    }
  )();
}
