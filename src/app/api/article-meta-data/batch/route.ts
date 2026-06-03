import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    const { articleIds } = await req.json();

    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: "articleIds must be a non-empty array.",
        data: {},
      });
    }

    const metas = await prisma.userArticleMeta.findMany({
      where: {
        userId,
        articleId: { in: articleIds },
      },
    });

    // Convertir array a un objeto { [articleId]: meta }
    const metaMap: Record<string, typeof metas[0]> = {};
    for (const meta of metas) {
      metaMap[meta.articleId] = meta;
    }

    return NextResponse.json({
      success: true,
      message: "Metadata retrieved successfully.",
      data: metaMap,
    });
  } catch (error) {
    console.error("Error fetching batch article meta:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
