import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const cu = await auth();
  const { id } = params || {};
  const { searchParams } = new URL(req.url);
  const isLoggedin = !!cu;
  const searchQuery = searchParams.get("query")?.trim().toLowerCase();
  let articleNumberSearch = null;

  if (searchQuery) {
    const articuloMatch = searchQuery.match(/^Articulo\s+(\d+)$/i);
    if (articuloMatch) {
      articleNumberSearch = parseInt(articuloMatch[1], 10);
    }
  }

  // All users have full access — no subscription required
  const hasFullAccess = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sections: any[] = [];

    if (articleNumberSearch) {
      const article = await prisma.article.findFirst({
        where: {
          articleNumber: articleNumberSearch,
          chapter: {
            section: {
              documentId: id,
            },
          },
        },
        include: {
          chapter: {
            include: {
              section: true,
            },
          },
        },
      });

      if (article) {
        sections = [
          {
            ...article.chapter.section,
            chapters: [
              {
                ...article.chapter,
                articles: [article],
              },
            ],
          },
        ];
      }
    } else if (searchQuery) {
      // Search in section title
      sections = await prisma.section.findMany({
        where: {
          documentId: id,
          title: { contains: searchQuery, mode: "insensitive" },
        },
        include: {
          chapters: {
            include: {
              articles: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      // Search in chapter title
      if (sections.length === 0) {
        sections = await prisma.section.findMany({
          where: {
            documentId: id,
            chapters: {
              some: {
                title: { contains: searchQuery, mode: "insensitive" },
              },
            },
          },
          include: {
            chapters: {
              where: {
                title: { contains: searchQuery, mode: "insensitive" },
              },
              include: { articles: true },
            },
          },
          orderBy: { createdAt: "asc" },
        });
      }

      // Search in article content
      if (sections.length === 0) {
        sections = await prisma.section.findMany({
          where: {
            documentId: id,
            chapters: {
              some: {
                articles: {
                  some: {
                    contentPlainText: {
                      contains: searchQuery,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          },
          include: {
            chapters: {
              where: {
                articles: {
                  some: {
                    contentPlainText: {
                      contains: searchQuery,
                      mode: "insensitive",
                    },
                  },
                },
              },
              include: {
                articles: {
                  where: {
                    contentPlainText: {
                      contains: searchQuery,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        });
      }

      // Filter empty chapters
      sections = sections
        .map((section) => ({
          ...section,
          chapters: section.chapters.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (chapter: any) => chapter.articles.length > 0
          ),
        }))
        .filter((section) => section.chapters.length > 0);

    } else {
      // No search — fetch all articles for all users
      sections = await prisma.section.findMany({
        where: { documentId: id },
        include: {
          chapters: {
            include: { articles: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json({
      success: true,
      message: sections.length > 0 ? "Sections fetched successfully" : "No results found",
      data: sections,
    });

  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sections",
        data: null,
      },
      { status: 500 }
    );
  }
}
