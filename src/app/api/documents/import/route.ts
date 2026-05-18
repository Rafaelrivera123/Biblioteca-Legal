// ============================================================
// ENDPOINT TO IMPORT LAW DOCUMENTS INTO THE DATABASE
// File location in your project:
//   src/app/api/documents/import/route.ts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // STEP 1: Check that the user is logged in and is an admin
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

    // STEP 2: Read the JSON coming from the import tool
    const data = await req.json();
    const { name, short_description, law_number, categories, published, sections } = data;

    // STEP 3: Make sure the JSON has the required fields
    if (!name || !sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: "Invalid JSON format. 'name' and 'sections' are required." },
        { status: 400 }
      );
    }

    // STEP 4: Create the main document (the law itself) in the database
    const document = await db.document.create({
      data: {
        name,
        short_description: short_description || "",
        law_number: law_number || "",
        categories: categories || [],
        published: published || false,
      },
    });

    // Counters for the final summary
    let totalSections = 0;
    let totalChapters = 0;
    let totalArticles = 0;

    // STEP 5: Save each Title/Section of the law (Título I, Título II, etc.)
    for (const sectionData of sections) {
      const section = await db.section.create({
        data: {
          title: sectionData.title,
          documentId: document.id,
        },
      });
      totalSections++;

      // STEP 6: Save each Chapter inside the Section
      for (const chapterData of sectionData.chapters || []) {
        const chapter = await db.chapter.create({
          data: {
            title: chapterData.title,
            sectionId: section.id,
          },
        });
        totalChapters++;

        // STEP 7: Save each Article inside the Chapter
        for (const articleData of chapterData.articles || []) {
          await db.article.create({
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

    // STEP 8: Return a summary of everything that was saved
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
