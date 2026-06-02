import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sections = await prisma.section.findMany({
      where: { documentId: params.id },
      include: {
        chapters: {
          include: {
            articles: {
              orderBy: { articleNumber: "asc" },
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

    return NextResponse.json({ success: true, data: articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
