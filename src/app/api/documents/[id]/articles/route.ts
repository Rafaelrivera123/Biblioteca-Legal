import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      select: {
        categories: {
          select: { categoryId: true },
        },
      },
    });

    const sections = await prisma.section.findMany({
      where: { documentId: params.id },
      include: {
        chapters: {
          include: {
            articles: {
              orderBy: [
                { articleNumber: "asc" },
                { articleLabel: "asc" },
              ],
              select: {
                id: true,
                articleNumber: true,
                articleLabel: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const articles = sections.flatMap((s) =>
      s.chapters.flatMap((c) =>
        c.articles.map((a) => ({
          id: a.id,
          articleNumber: a.articleNumber,
          articleLabel: a.articleLabel,
          display: a.articleLabel ?? String(a.articleNumber),
          section: s.title,
          chapter: c.title,
        }))
      )
    );

    const categoryIds = document?.categories.map((c) => c.categoryId) ?? [];

    return NextResponse.json({ success: true, data: articles, categoryIds });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ success: false, data: [], categoryIds: [] }, { status: 500 });
  }
}
