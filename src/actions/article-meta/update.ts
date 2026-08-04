"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

interface UpdateMetaInput {
  articleId: string;
  selectedColor?: string | null;
  isBookmarked?: boolean;
  comment?: string;
  documentId: string;
}

export async function updateArticleMeta({
  articleId,
  selectedColor,
  isBookmarked,
  comment,
  documentId,
}: UpdateMetaInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "No autorizado." };
  }

  const userId = session.user.id;

  try {
    const updatedMeta = await prisma.userArticleMeta.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      update: {
        ...(selectedColor !== undefined && { selectedColor }),
        ...(isBookmarked !== undefined && { isBookmarked }),
        ...(comment !== undefined && { comment }),
      },
      create: {
        userId,
        articleId,
        selectedColor: selectedColor ?? undefined,
        isBookmarked: isBookmarked ?? false,
        comment: comment ?? undefined,
        documentId,
      },
    });

    return {
      success: true,
      message: "Los metadatos del artículo se actualizaron correctamente.",
      data: updatedMeta,
    };
  } catch (error) {
    console.error("Failed to update article meta:", error);
    return {
      success: false,
      message: "No se pudieron actualizar los metadatos del artículo.",
    };
  }
}

interface RemoveBookmarkInput {
  metaId: string;
}

export async function removeBookmark({ metaId }: RemoveBookmarkInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "No autorizado." };
  }

  try {
    const existing = await prisma.userArticleMeta.findFirst({
      where: { id: metaId, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, message: "Marcador no encontrado." };
    }

    // Clear bookmark flag but keep notes/highlights on the same row
    const updatedMeta = await prisma.userArticleMeta.update({
      where: { id: metaId },
      data: { isBookmarked: false },
    });

    return {
      success: true,
      message: "Marcador eliminado correctamente.",
      data: updatedMeta,
    };
  } catch (error) {
    console.error("Failed to remove bookmark:", error);
    return {
      success: false,
      message: "No se pudo eliminar el marcador.",
    };
  }
}

export async function removeHighlight({ metaId }: RemoveBookmarkInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "No autorizado." };
  }

  try {
    const existing = await prisma.userArticleMeta.findFirst({
      where: { id: metaId, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, message: "Resaltado no encontrado." };
    }

    const updatedMeta = await prisma.userArticleMeta.update({
      where: { id: metaId },
      data: { selectedColor: null },
    });

    return {
      success: true,
      message: "Resaltado eliminado correctamente.",
      data: updatedMeta,
    };
  } catch (error) {
    console.error("Failed to remove highlight:", error);
    return {
      success: false,
      message: "No se pudo eliminar el resaltado.",
    };
  }
}

export async function removeNotes({ metaId }: RemoveBookmarkInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "No autorizado." };
  }

  try {
    const existing = await prisma.userArticleMeta.findFirst({
      where: { id: metaId, userId: session.user.id },
    });

    if (!existing) {
      return { success: false, message: "Nota no encontrada." };
    }

    const updatedMeta = await prisma.userArticleMeta.update({
      where: { id: metaId },
      data: { comment: "" },
    });

    return {
      success: true,
      message: "Nota eliminada correctamente.",
      data: updatedMeta,
    };
  } catch (error) {
    console.error("Failed to remove notes:", error);
    return {
      success: false,
      message: "No se pudo eliminar la nota.",
    };
  }
}
