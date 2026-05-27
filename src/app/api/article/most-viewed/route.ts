import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      take: 6,
      orderBy: [
        { viewCount: "desc" },
        { userMeta: { _count: "desc" } },
      ],
      include: {
        chapter: {
          include: {
            section: {
              include: {
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

    return NextResponse.json(articles);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error fetching most viewed articles" },
      { status: 500 }
    );
  }
}
