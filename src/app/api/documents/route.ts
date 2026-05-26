import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * pageSize;
    const query = searchParams.get("search")?.toLowerCase() || "";
    const category = searchParams.get("category") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" as const } },
        { law_number: { contains: query, mode: "insensitive" as const } },
        { sections: { some: { title: { contains: query, mode: "insensitive" as const } } } },
        { sections: { some: { chapters: { some: { title: { contains: query, mode: "insensitive" as const } } } } } },
      ];
    }

    if (category && category !== "all") {
      whereClause.categories = { some: { categoryId: category } };
    }

    const totalCount = await prisma.document.count({ where: whereClause });

    const documents = await prisma.document.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        categories: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully retrieved documents",
      data: documents,
      meta: {
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        totalCount,
      },
    });
  } catch (error) {
    console.error("[GET_DOCUMENTS]", error);
    return NextResponse.json(
      { message: "Internal Server Error", success: false },
      { status: 500 }
    );
  }
}
