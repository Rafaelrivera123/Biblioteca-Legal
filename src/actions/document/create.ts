"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { documentFormSchema, DocumentFormSchemaType } from "@/schemas/document";

export async function createDocument(data: DocumentFormSchemaType) {
  const cu = await auth();
  if (!cu || cu.user.role !== "admin") {
    return { success: false, message: "Unauthorized access." };
  }

  const parsed = documentFormSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const categoryIds = parsed.data.categoryIds ?? [];
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });

  const newDoc = await prisma.document.create({
    data: {
      name: parsed.data.name,
      short_description: parsed.data.short_description ?? "",
      law_number: parsed.data.law_number ?? "",
      publishedAt: parsed.data.publishedDate,
      categories: {
        create: categories.map((cat) => ({
          categoryId: cat.id,
          name: cat.name,
        })),
      },
    },
  });

  return { success: true, message: "Document created successfully.", data: newDoc };
}

export async function editDocument(id: string, data: DocumentFormSchemaType) {
  const cu = await auth();
  if (!cu || cu.user.role !== "admin") {
    return { success: false, message: "Unauthorized access." };
  }

  const parsed = documentFormSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors.map((e) => e.message).join(", ") };
  }

  const categoryIds = parsed.data.categoryIds ?? [];
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });

  // Delete old categories and create new ones
  await prisma.documentCategory.deleteMany({ where: { documentId: id } });

  const updatedDoc = await prisma.document.update({
    where: { id },
    data: {
      name: parsed.data.name,
      short_description: parsed.data.short_description ?? "",
      law_number: parsed.data.law_number ?? "",
      publishedAt: parsed.data.publishedDate,
      categories: {
        create: categories.map((cat) => ({
          categoryId: cat.id,
          name: cat.name,
        })),
      },
    },
  });

  return { success: true, message: "Document updated successfully.", data: updatedDoc };
}
