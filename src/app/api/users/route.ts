import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const whereClause = {
    OR: [
      { first_name: { contains: query, mode: "insensitive" as const } },
      { last_name: { contains: query, mode: "insensitive" as const } },
      { email: { contains: query, mode: "insensitive" as const } },
    ],
  };

  try {
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        userSubscription: {
          select: { isActive: true },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.user.count({ where: whereClause });

    return NextResponse.json({
      success: true,
      message: "Users fetched successfully",
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", data: null },
      { status: 500 }
    );
  }
}
