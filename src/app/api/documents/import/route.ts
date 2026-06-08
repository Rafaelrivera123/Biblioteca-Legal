import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const data = await req.json();
    const { name, slug, short_description, law_number, published, sections, categoryIds } = data;

    if (!name || !sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: "Invalid JSON format." }, { status: 400 });
    }

    const categories = categoryIds?.length
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];

    const document = await prisma.document.create({
      data: {
        name,
        slug: slug || null,
        short_description: short_description || "",
        law_number: law_number || "",
        published: published ?? true,
        categories: {
          create: categories.map((cat) => ({
            categoryId: cat.id,
            name: cat.name,
          })),
        },
      },
    });

    let totalSections = 0;
    let totalChapters = 0;
    let totalArticles = 0;
    let skippedDuplicates = 0;

    for (const sectionData of sections) {
      const section = await prisma.section.create({
        data: { title: sectionData.title, documentId: document.id },
      });
      totalSections++;

      for (const chapterData of sectionData.chapters || []) {
        const chapter = await prisma.chapter.create({
          data: { title: chapterData.title, sectionId: section.id },
        });
        totalChapters++;

        const seenArticleLabels = new Set<string>();
        for (const articleData of chapterData.articles || []) {
          const label = articleData.articleLabel || String(articleData.articleNumber);
          if (seenArticleLabels.has(label)) {
            skippedDuplicates++;
            continue;
          }
          seenArticleLabels.add(label);
          await prisma.article.create({
            data: {
              articleNumber: articleData.articleNumber,
              articleLabel: articleData.articleLabel || null,
              content: articleData.content || "",
              contentPlainText: articleData.contentPlainText || "",
              chapterId: chapter.id,
            },
          });
          totalArticles++;
        }
      }
    }

    // Disparar batch de summaries para el documento recién importado (fire and forget)
    fetch(`${process.env.NEXTAUTH_URL}/api/ai/batch-create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ documentId: document.id, limit: 10000 }),
    }).catch((err) => console.error("Error disparando batch de summaries:", err));

    return NextResponse.json({
      success: true,
      message: `Law "${name}" was imported successfully.`,
      documentId: document.id,
      summary: {
        sections: totalSections,
        chapters: totalChapters,
        articles: totalArticles,
        skippedDuplicates,
      },
    });
  } catch (error: unknown) {
    console.error("Error importing law:", error);
    return NextResponse.json(
      { error: "Internal server error.", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
