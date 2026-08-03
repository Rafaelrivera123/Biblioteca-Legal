import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) return error;
  const { searchParams } = new URL(req.url);

  const searchQuery = searchParams.get("searchQuery") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const skip = (page - 1) * limit;

  try {
    const [companies, totalCount] = await Promise.all([
      prisma.company.findMany({
        where: {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        skip,
        take: limit,
        include: {
          employees: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.company.count({
        where: {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      }),
    ]);

    const result = companies.map((company) => ({
      id: company.id,
      name: company.name,
      location: company.location,
      totalEmployees: company.employees.length,
      contact_email: company.contact_email,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      message: "Companies fetched successfully",
      data: result,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        data: [],
        pagination: null,
      },
      { status: 500 }
    );
  }
}
