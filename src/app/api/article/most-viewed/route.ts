import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

// El widget "Artículos más vistos" (most-viewed-articles.tsx) solo usa
// contentPlainText recortado a 150 caracteres, nunca el HTML completo. Antes
// esta consulta traía el campo `content` (texto completo) de los 6
// artículos SIN select, en cada carga de la página, sin cache. Con `select`
// dejamos de traer contenido que nunca se muestra, y con unstable_cache el
// ranking se comparte 5 minutos entre visitas en vez de pedirse a Neon en
// cada una.
const getMostViewedArticles = unstable_cache(
  async () => {
    return prisma.article.findMany({
      take: 6,
      orderBy: [
        { viewCount: "desc" },
        { userMeta: { _count: "desc" } },
      ],
      select: {
        id: true,
        articleNumber: true,
        contentPlainText: true,
        viewCount: true,
        chapter: {
          select: {
            id: true,
            section: {
              select: {
                id: true,
                document: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        _count: {
          select: { userMeta: true },
        },
      },
    });
  },
  ["most-viewed-articles"],
  { revalidate: 300 }
);

export async function GET() {
  try {
    const articles = await getMostViewedArticles();
    return NextResponse.json(articles);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error fetching most viewed articles" },
      { status: 500 }
    );
  }
}
