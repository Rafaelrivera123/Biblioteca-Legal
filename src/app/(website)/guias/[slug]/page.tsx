import GuideArticle from "@/components/guides/GuideArticle";
import { getAllGuides, getGuideBySlug } from "@/content/guias";
import {
  SITE_OG_IMAGE,
  SITE_URL,
  buildSeoDescription,
  buildSeoTitle,
} from "@/lib/seo";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return getAllGuides().map((guide) => ({ slug: guide.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const guide = getGuideBySlug(params.slug);
  if (!guide) return { title: "Guía no encontrada" };

  const url = `${SITE_URL}/guias/${guide.slug}`;
  const title = buildSeoTitle(guide.title);
  const description = buildSeoDescription(guide.description);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: guide.title,
      description,
      url,
      siteName: "Biblioteca Legal HN",
      locale: "es_HN",
      type: "article",
      publishedTime: `${guide.updatedAt}T12:00:00.000Z`,
      modifiedTime: `${guide.updatedAt}T12:00:00.000Z`,
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description,
      images: [SITE_OG_IMAGE],
    },
  };
}

export default function GuiaDetailPage({ params }: Props) {
  const guide = getGuideBySlug(params.slug);
  if (!guide) notFound();

  const url = `${SITE_URL}/guias/${guide.slug}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.title,
            description: guide.description,
            url,
            inLanguage: "es-HN",
            datePublished: `${guide.updatedAt}T12:00:00.000Z`,
            dateModified: `${guide.updatedAt}T12:00:00.000Z`,
            author: {
              "@type": "Organization",
              name: "Biblioteca Legal HN",
              url: SITE_URL,
            },
            publisher: {
              "@type": "Organization",
              name: "Biblioteca Legal HN",
              url: SITE_URL,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Inicio",
                item: SITE_URL,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Guías",
                item: `${SITE_URL}/guias`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: guide.title,
                item: url,
              },
            ],
          }),
        }}
      />
      <GuideArticle guide={guide} />
    </>
  );
}
