"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
export async function publishLegalUpdate(id: string) {
  try {
    const cu = await auth();
    if (!cu || cu.user.role !== "admin") {
      return {
        success: false,
        message: "Unauthorized access.",
      };
    }
    const existing = await prisma.legalUpdatePost.findUnique({
      where: { id },
    });
    if (!existing) {
      return {
        success: false,
        message: "Update not found.",
      };
    }
    await prisma.legalUpdatePost.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: existing.publishedAt ?? new Date(),
      },
    });
    revalidatePath("/dashboard/legal-updates");
    revalidatePath("/actualizaciones");
    revalidatePath(`/actualizaciones/${existing.slug}`);
    return {
      success: true,
      message: "Actualización publicada correctamente.",
    };
  } catch (error) {
    console.error("Failed to publish legal update:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    };
  }
}
