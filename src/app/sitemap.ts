import { getAllGuides } from "@/content/guias";
import { prisma } from "@/lib/db";
import { sitemapPriorityForDocument } from "@/lib/head-codes";
import { isSubstantialLegalUpdate } from "@/lib/legal-update-quality";
import { SITE_URL } from "@/lib/seo";
import { MetadataRoute } from "next";

export const revalidate = 3600;
export const runtime = "nodejs";
export const maxDuration = 60;

function safeDate(value: Date | string | null | undefined): Date {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, priority: 1, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE_URL}/collections`, priority: 0.9, changeFrequency: "daily", lastModified: now },
    { url: `${SITE_URL}/actualizaciones`, priority: 0.8, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE_URL}/guias`, priority: 0.85, changeFrequency: "weekly", lastModified: now },
    ...getAllGuides().map((guide) => ({
      url: `${SITE_URL}/guias/${guide.slug}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
      lastModified: safeDate(`${guide.updatedAt}T12:00:00`),
    })),
    { url: `${SITE_URL}/gacetas`, priority: 0.6, changeFrequency: "weekly", lastModified: now },
    { url: `${SITE_URL}/legal-ai`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
    { url: `${SITE_URL}/about-us`, priority: 0.5, changeFrequency: "yearly", lastModified: now },
    { url: `${SITE_URL}/contact`, priority: 0.5, changeFrequency: "yearly", lastModified: now },
    { url: `${SITE_URL}/subscriptions`, priority: 0.7, changeFrequency: "monthly", lastModified: now },
    { url: `${SITE_URL}/privacy-policy`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
    { url: `${SITE_URL}/cookie-policy`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
    { url: `${SITE_URL}/terms-and-condition`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
    { url: `${SITE_URL}/refund-policy`, priority: 0.3, changeFrequency: "yearly", lastModified: now },
  ];

  let documentEntries: MetadataRoute.Sitemap = [];
  let updateEntries: MetadataRoute.Sitemap = [];

  try {
    const [documentsResult, updatesResult] = await Promise.allSettled([
      prisma.document.findMany({
        select: { id: true, slug: true, updatedAt: true },
        where: { published: true },
      }),
      prisma.legalUpdatePost.findMany({
        select: {
          slug: true,
          title: true,
          summary: true,
          content: true,
          type: true,
          relatedDocumentId: true,
          publishedAt: true,
          updatedAt: true,
        },
        where: { status: "published" },
      }),
    ]);

    if (documentsResult.status === "fulfilled") {
      documentEntries = documentsResult.value.map((doc) => {
        const slug = doc.slug || doc.id;
        return {
          url: `${SITE_URL}/collections/${slug}`,
          lastModified: safeDate(doc.updatedAt),
          changeFrequency: "monthly" as const,
          priority: sitemapPriorityForDocument(doc.slug),
        };
      });
    } else {
      console.error("Error cargando documentos para sitemap:", documentsResult.reason);
    }

    if (updatesResult.status === "fulfilled") {
      updateEntries = updatesResult.value
        .filter(isSubstantialLegalUpdate)
        .map((post) => ({
          url: `${SITE_URL}/actualizaciones/${post.slug}`,
          lastModified: safeDate(post.updatedAt ?? post.publishedAt),
          changeFrequency: "never" as const,
          priority: 0.6,
        }));
    } else {
      console.error("Error cargando actualizaciones para sitemap:", updatesResult.reason);
    }
  } catch (error) {
    // Nunca fallar el endpoint completo: devolver al menos las URLs estáticas.
    console.error("Error generando sitemap:", error);
  }

  return [...staticEntries, ...documentEntries, ...updateEntries];
}
