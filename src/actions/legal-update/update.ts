"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
interface UpdateLegalUpdateInput {
  id: string;
  title: string;
  summary: string;
  content: string;
}
export async function updateLegalUpdate(input: UpdateLegalUpdateInput) {
  try {
    const cu = await auth();
    if (!cu || cu.user.role !== "admin") {
      return {
        success: false,
        message: "Unauthorized access.",
      };
    }
    const existing = await prisma.legalUpdatePost.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      return {
        success: false,
        message: "Update not found.",
      };
    }
    if (!input.title.trim() || !input.summary.trim() || !input.content.trim()) {
      return {
        success: false,
        message: "Todos los campos son obligatorios.",
      };
    }
    await prisma.legalUpdatePost.update({
      where: { id: input.id },
      data: {
        title: input.title.trim(),
        summary: input.summary.trim(),
        content: input.content,
      },
    });
    revalidatePath("/dashboard/legal-updates");
    revalidatePath("/actualizaciones");
    revalidatePath(`/actualizaciones/${existing.slug}`);
    return {
      success: true,
      message: "Actualización guardada correctamente.",
    };
  } catch (error) {
    console.error("Failed to update legal update:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    };
  }
}
