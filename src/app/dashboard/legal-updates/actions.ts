"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("No autorizado");
}

export async function createLegalUpdate(formData: FormData) {
  await requireAdmin();

  const title = formData.get("title") as string;
  const summary = formData.get("summary") as string;
  const type = formData.get("type") as "REFORM" | "NEW_LAW" | "REPEAL";
  const gacetaNumber = (formData.get("gacetaNumber") as string) || null;
  const content = formData.get("content") as string;
  const status = formData.get("status") as "draft" | "published";
  const relatedDocumentId = (formData.get("relatedDocumentId") as string) || null;

  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.legalUpdatePost.findFirst({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  await prisma.legalUpdatePost.create({
    data: {
      title,
      slug,
      summary,
      type,
      gacetaNumber,
      content,
      status,
      publishedAt: status === "published" ? new Date() : null,
      relatedDocumentId,
    },
  });

  revalidatePath("/actualizaciones");
  revalidatePath("/dashboard/legal-updates");
  redirect("/dashboard/legal-updates");
}

export async function updateLegalUpdate(id: string, formData: FormData) {
  await requireAdmin();

  const title = formData.get("title") as string;
  const summary = formData.get("summary") as string;
  const type = formData.get("type") as "REFORM" | "NEW_LAW" | "REPEAL";
  const gacetaNumber = (formData.get("gacetaNumber") as string) || null;
  const content = formData.get("content") as string;
  const status = formData.get("status") as "draft" | "published";
  const relatedDocumentId = (formData.get("relatedDocumentId") as string) || null;

  const existing = await prisma.legalUpdatePost.findUnique({ where: { id } });
  if (!existing) throw new Error("Post no encontrado");

  await prisma.legalUpdatePost.update({
    where: { id },
    data: {
      title,
      summary,
      type,
      gacetaNumber,
      content,
      status,
      publishedAt: status === "published" && !existing.publishedAt ? new Date() : existing.publishedAt,
      relatedDocumentId,
    },
  });

  revalidatePath("/actualizaciones");
  revalidatePath(`/actualizaciones/${existing.slug}`);
  revalidatePath("/dashboard/legal-updates");
  redirect("/dashboard/legal-updates");
}

export async function deleteLegalUpdate(id: string) {
  await requireAdmin();

  const post = await prisma.legalUpdatePost.findUnique({ where: { id } });
  if (!post) throw new Error("Post no encontrado");

  await prisma.legalUpdatePost.delete({ where: { id } });

  revalidatePath("/actualizaciones");
  revalidatePath(`/actualizaciones/${post.slug}`);
  revalidatePath("/dashboard/legal-updates");
}
