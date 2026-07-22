import { prisma } from "@/lib/db";
import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.bibliotecalegalhn.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let documentEntries: MetadataRoute.Sitemap = [];
  let updateEntries: MetadataRoute.Sitemap = [];

  try {
    const [documents, updates] = await Promise.all([
      prisma.document.findMany({
        select: { id: true, slug: true, updatedAt: true },
        where: { published: true },
      }),
      prisma.legalUpdatePost.findMany({
        select: { slug: true, publishedAt: true, updatedAt: true },
        where: { status: "published" },
      }),
    ]);

    documentEntries = documents.map((doc) => {
      // Importante: usar el slug completo tal como está guardado. Cortarlo
      // aquí generaba una URL que no coincidía con ningún documento real
      // (causaba los 404 reportados por Ahrefs).
      const slug = doc.slug || doc.id;
      return {
        url: `${BASE_URL}/collections/${slug}`,
        lastModified: new Date(doc.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      };
    });

    updateEntries = updates.map((post) => ({
      url: `${BASE_URL}/actualizaciones/${post.slug}`,
      lastModified: new Date(post.updatedAt ?? post.publishedAt ?? new Date()),
      changeFrequency: "never" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error generando sitemap:", error);
  }

  const now = new Date();
  return [
    { url: `${BASE_URL}`, priority: 1, changeFrequency: "weekly", lastModified: now },
    { url: `${BASE_URL}/collections`, priority: 0.9, changeFrequency: "daily", lastModified: now },
    { url: `${BASE_URL}/actualizaciones`, priority: 0.8, changeFrequency: "weekly", lastModified: now },
    { url: `${BASE_URL}/about-us`, priority: 0.5, changeFrequency: "yearly", lastModified: now },
    { url: `${BASE_URL}/contact`, priority: 0.5, changeFrequency: "yearly", lastModified: now },
    { url: `${BASE_URL}/subscriptions`, priority: 0.7, changeFrequency: "monthly", lastModified: now },
    ...documentEntries,
    ...updateEntries,
  ];
}
