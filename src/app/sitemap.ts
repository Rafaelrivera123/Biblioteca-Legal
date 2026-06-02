import { prisma } from "@/lib/db";
import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.bibliotecalegalhn.com";

function truncateSlug(slug: string, maxLength = 70): string {
  if (slug.length <= maxLength) return slug;
  const truncated = slug.substring(0, maxLength);
  const lastDash = truncated.lastIndexOf("-");
  return lastDash > 40 ? truncated.substring(0, lastDash) : truncated;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let documentEntries: MetadataRoute.Sitemap = [];

  try {
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        slug: true,
        updatedAt: true,
      },
      where: { published: true },
    });

    documentEntries = documents.map((doc) => {
      const rawSlug = doc.slug || doc.id;
      const safeSlug = truncateSlug(rawSlug);
      return {
        url: `${BASE_URL}/collections/${safeSlug}`,
        lastModified: new Date(doc.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      };
    });
  } catch (error) {
    console.error("Error generando sitemap:", error);
    documentEntries = [];
  } finally {
    await prisma.$disconnect();
  }

  const now = new Date();

  return [
    { url: `${BASE_URL}`, priority: 1, changeFrequency: "weekly", lastModified: now },
    { url: `${BASE_URL}/collections`, priority: 0.9, changeFrequency: "daily", lastModified: now },
    { url: `${BASE_URL}/subscriptions`, priority: 0.7, changeFrequency: "monthly", lastModified: now },
    { url: `${BASE_URL}/about-us`, priority: 0.5, changeFrequency: "yearly", lastModified: now },
    { url: `${BASE_URL}/contact`, priority: 0.5, changeFrequency: "yearly", lastModified: now },
    ...documentEntries,
  ];
}
