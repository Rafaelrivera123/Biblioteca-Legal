// ENDPOINT TO IMPORT LAW DOCUMENTS INTO THE DATABASE
// File location: src/app/api/documents/import/route.ts

/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied. Only admins can import laws." },
        { status: 403 }
      );
    }

    const data = await req.json();
    const { name, short_description, law_number, categories, published, sections } = data;

    if (!name || !sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: "Invalid JSON format. 'name' and 'sections' are required." },
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        name,
        short_description: short_description || "",
        law_number: law_number || "",
        categories: categories || [],
        published: published || false,
      },
    });

    let totalSections = 0;
    let totalChapters = 0;
    let totalArticles = 0;

    for (const sectionData of sections) {
      const section = await prisma.section.create({
        data: {
          title: sectionData.title,
          documentId: document.id,
        },
      });
      totalSections++;

      for (const chapterData of sectionData.chapters || []) {
        const chapter = await prisma.chapter.create({
          data: {
            title: chapterData.title,
            sectionId: section.id,
          },
        });
        totalChapters++;

        for (const articleData of chapterData.articles || []) {
          await prisma.article.create({
            data: {
              articleNumber: articleData.articleNumber,
              content: articleData.content || "",
              contentPlainText: articleData.contentPlainText || "",
              chapterId: chapter.id,
            },
          });
          totalArticles++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Law "${name}" was imported successfully.`,
      documentId: document.id,
      summary: {
        sections: totalSections,
        chapters: totalChapters,
        articles: totalArticles,
      },
    });

  } catch (error: unknown) {
    console.error("Error importing law:", error);
    return NextResponse.json(
      {
        error: "Internal server error.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
