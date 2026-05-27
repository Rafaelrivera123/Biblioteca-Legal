import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: { articleId: string } }
) {
  try {
    await prisma.article.update({
      where: { id: params.articleId },
      data: { viewCount: { increment: 1 } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error updating view count" },
      { status: 500 }
    );
  }
}
