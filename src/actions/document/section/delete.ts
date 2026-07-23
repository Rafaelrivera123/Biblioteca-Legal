"use server";

import { prisma } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";

export async function deleteDocumentSection(
  sectionId: string,
  documentId: string
) {
  try {
    await prisma.section.delete({
      where: { id: sectionId },
    });

    revalidatePath(`/dashboard/documents/${documentId}`);
    // Reforma visible al instante en /collections/[id]: invalida la cache
    // pública del documento en vez de esperar los 10 min de revalidate.
    revalidateTag(`document-${documentId}`);

    return {
      success: true,
      message: "Section and its chapters deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting section:", error);
    return {
      success: false,
      message: "Failed to delete section",
    };
  }
}
