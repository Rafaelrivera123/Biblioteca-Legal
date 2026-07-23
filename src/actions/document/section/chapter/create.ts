"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { chapterTitleSchema, ChapterTitleSchemaType } from "@/schemas/document";
import { revalidatePath, revalidateTag } from "next/cache";

export async function createDocumentChapterTitle(
  data: ChapterTitleSchemaType,
  documentId: string
) {
  const cu = await auth();
  if (!cu || cu.user.role !== "admin") {
    return {
      success: false,
      message: "Unauthorized access.",
    };
  }

  const parsedData = chapterTitleSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      message: parsedData.error.message,
    };
  }

  try {
    // Create a new section in the database
    const section = await prisma.chapter.create({
      data: {
        title: parsedData.data.title,
        sectionId: parsedData.data.sectionId,
      },
    });

    revalidatePath(`/dashboard/documents/${documentId}`);
    // Reforma visible al instante en /collections/[id]: invalida la cache
    // pública del documento en vez de esperar los 10 min de revalidate.
    revalidateTag(`document-${documentId}`);
    return {
      success: true,
      message: "Section created successfully",
      section,
    };
  } catch (error) {
    console.error("Error creating section:", error);
    return {
      success: false,
      message: "Failed to create section",
    };
  }
}
