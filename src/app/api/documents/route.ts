import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * pageSize;
    const query = searchParams.get("search")?.toLowerCase().trim() || "";
    const category = searchParams.get("category") || undefined;

    const isDefaultView = (!category || category === "all") && !query;

    if (query) {
      const likeQuery = `%${query}%`;
      const categoryFilter = category && category !== "all" ? category : null;

      const categoryCondition = categoryFilter
        ? Prisma.sql`AND EXISTS (
            SELECT 1 FROM "DocumentCategory" dc
            WHERE dc."documentId" = d.id AND dc."categoryId" = ${categoryFilter}
          )`
        : Prisma.empty;

      const results = await prisma.$queryRaw<{ id: string }[]>`
        SELECT DISTINCT d.id,
          GREATEST(
            similarity(d.name, ${query}),
            similarity(d.law_number, ${query}),
            similarity(d.short_description, ${query})
          ) AS relevance
        FROM "Document" d
        WHERE d.published = true
          AND (
            d.name ILIKE ${likeQuery}
            OR d.law_number ILIKE ${likeQuery}
            OR d.short_description ILIKE ${likeQuery}
            OR similarity(d.name, ${query}) > 0.3
            OR similarity(d.law_number, ${query}) > 0.3
            OR similarity(d.short_description, ${query}) > 0.3
            OR EXISTS (
              SELECT 1 FROM "Section" s
              WHERE s."documentId" = d.id
              AND (s.title ILIKE ${likeQuery} OR similarity(s.title, ${query}) > 0.3)
            )
            OR EXISTS (
              SELECT 1 FROM "Chapter" c
              JOIN "Section" s ON c."sectionId" = s.id
              WHERE s."documentId" = d.id
              AND (c.title ILIKE ${likeQuery} OR similarity(c.title, ${query}) > 0.3)
            )
          )
          ${categoryCondition}
        ORDER BY relevance DESC
        LIMIT ${pageSize} OFFSET ${skip}
      `;

      const totalResult = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT d.id) as count
        FROM "Document" d
        WHERE d.published = true
          AND (
            d.name ILIKE ${likeQuery}
            OR d.law_number ILIKE ${likeQuery}
            OR d.short_description ILIKE ${likeQuery}
            OR similarity(d.name, ${query}) > 0.3
            OR similarity(d.law_number, ${query}) > 0.3
            OR similarity(d.short_description, ${query}) > 0.3
            OR EXISTS (
              SELECT 1 FROM "Section" s
              WHERE s."documentId" = d.id
              AND (s.title ILIKE ${likeQuery} OR similarity(s.title, ${query}) > 0.3)
            )
            OR EXISTS (
              SELECT 1 FROM "Chapter" c
              JOIN "Section" s ON c."sectionId" = s.id
              WHERE s."documentId" = d.id
              AND (c.title ILIKE ${likeQuery} OR similarity(c.title, ${query}) > 0.3)
            )
          )
          ${categoryCondition}
      `;

      const orderedIds = results.map((r) => r.id);

      const docs = await prisma.document.findMany({
        where: { id: { in: orderedIds } },
        include: { categories: true },
      });

      const documents = orderedIds
        .map((id) => docs.find((d) => d.id === id))
        .filter(Boolean);

      const totalCount = Number(totalResult[0]?.count ?? 0);

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
    }

    // Sin búsqueda, usar Prisma normal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { published: true };

    if (category && category !== "all") {
      whereClause.categories = { some: { categoryId: category } };
    }

    const orderBy = isDefaultView
      ? [{ viewCount: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }, { id: "desc" as const }];

    const totalCount = await prisma.document.count({ where: whereClause });

    const documents = await prisma.document.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy,
      include: { categories: true },
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
