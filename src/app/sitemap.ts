import { prisma } from "@/lib/db";
import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.bibliotecalegalhn.com";

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

    documentEntries = documents.map((doc) => ({
      url: `${BASE_URL}/collections/${doc.slug || doc.id}`,
      lastModified: new Date(doc.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    documentEntries = [];
  }

  return [
    { url: `${BASE_URL}`, priority: 1, changeFrequency: "weekly" },
    { url: `${BASE_URL}/collections`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/subscriptions`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE_URL}/about-us`, priority: 0.5, changeFrequency: "yearly" },
    { url: `${BASE_URL}/contact`, priority: 0.5, changeFrequency: "yearly" },
    ...documentEntries,
  ];
}
