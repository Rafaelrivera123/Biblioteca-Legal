import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { MetadataRoute } from "next";

export const revalidate = 3600;

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
        url: `${SITE_URL}/collections/${slug}`,
        lastModified: new Date(doc.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      };
    });

    updateEntries = updates.map((post) => ({
      url: `${SITE_URL}/actualizaciones/${post.slug}`,
      lastModified: new Date(post.updatedAt ?? post.publishedAt ?? new Date()),
      changeFrequency: "never" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error generando valores del sitemap:", error);
  }

  const now = new Date();
  return [
    { url: `${SITE_URL}`, priority: 1, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE_URL}/collections`, priority: 0.9, changeFrequency: "daily", lastModified: now },
    { url: `${SITE_URL}/actualizaciones`, priority: 0.8, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE_URL}/gacetas`, priority: 0.6, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE_URL}/legal-ai`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
    { url: `${SITE_URL}/about-us`, priority: 0.5, changeFrequency: "yearly", lastModified: now },
    { url: `${SITE_URL}/contact`, priority: 0.5, changeFrequency: "yearly", lastModified: now },
    { url: `${SITE_URL}/subscriptions`, priority: 0.7, changeFrequency: "monthly", lastModified: now },
    { url: `${SITE_URL}/privacy-policy`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
    { url: `${SITE_URL}/terms-and-condition`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
    { url: `${SITE_URL}/refund-policy`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
    ...documentEntries,
    ...updateEntries,
  ];
}
