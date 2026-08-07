"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function watchLater(documentId: string) {
  const cu = await auth();

  if (!cu || !cu.user || !cu.user.id) {
    return {
      success: false,
      message: "Authentication required. Please log in.",
    };
  }

  const exists = await prisma.watchLists.findFirst({
    where: {
      userId: cu.user.id,
      documentId,
    },
  });

  if (exists) {
    return {
      success: false,
      message: "This item is already in your Watch Later list.",
    };
  }

  try {
    const data = await prisma.watchLists.create({
      data: {
        userId: cu.user.id,
        documentId,
      },
    });

    revalidatePath("/account/documents");
    revalidatePath("/mi-biblioteca/documentos");

    return {
      success: true,
      message: "Item added to your Watch Later list.",
      data, // optional, remove this line if you don't want to expose created data
    };
  } catch (error) {
    console.error("Error adding to Watch Later:", error);
    return {
      success: false,
      message:
        "An error occurred while adding the item. Please try again later.",
    };
  }
}

export async function removeWatchLater(documentId: string) {
  const cu = await auth();

  if (!cu || !cu.user || !cu.user.id) {
    return {
      success: false,
      message: "Authentication required. Please log in.",
    };
  }

  try {
    const existing = await prisma.watchLists.findFirst({
      where: {
        userId: cu.user.id,
        documentId,
      },
    });

    if (!existing) {
      return {
        success: false,
        message: "Item not found in your Watch Later list.",
      };
    }

    await prisma.watchLists.delete({
      where: {
        id: existing.id,
      },
    });

    revalidatePath("/account/documents");
    revalidatePath("/mi-biblioteca/documentos");

    return {
      success: true,
      message: "Item removed from your Watch Later list.",
    };
  } catch (error) {
    console.error("Error removing from Watch Later:", error);
    return {
      success: false,
      message:
        "An error occurred while removing the item. Please try again later.",
    };
  }
}
