"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";

// Delete Document Chapter Server Action
export async function deleteDocumentChapter(
  chapterId: string,
  documentId: string
) {
  const cu = await auth();
  if (!cu || cu.user.role !== "admin") {
    return {
      success: false,
      message: "Unauthorized access.",
    };
  }

  try {
    // Delete the chapter from the database
    await prisma.chapter.delete({
      where: {
        id: chapterId,
      },
    });

    revalidatePath(`/dashboard/documents/${documentId}`);
    // Reforma visible al instante en /collections/[id]: invalida la cache
    // pública del documento en vez de esperar los 10 min de revalidate.
    revalidateTag(`document-${documentId}`);

    return {
      success: true,
      message: "Chapter deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return {
      success: false,
      message: "Failed to delete chapter",
    };
  }
}
