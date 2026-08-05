import { auth } from "@/auth";
import AdSenseScript from "@/components/ads/AdSenseScript";
import FreePlanMeter from "@/components/ads/FreePlanMeter";
import { isSubscribed } from "@/helper/subscription";
import { prisma } from "@/lib/db";
import { FREE_AI_CHAT_LIMIT } from "@/lib/pricing";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import ArticleContainer from "./_components/article-container";
import CollectionHeader from "./_components/collection-header";
import LegalChatbot from "./_components/legal-chatbot";
import LawFaq from "./_components/law-faq";
import { getDocumentSections } from "@/lib/document-content";
import {
  getHeadCode,
  getHeadCodeDisplayTitle,
  getRelatedGuidesForCollection,
} from "@/lib/head-codes";
import { getDocumentFaqs } from "@/lib/law-faqs";
import {
  SITE_OG_IMAGE,
  buildSeoDescription,
  buildSeoTitle,
} from "@/lib/seo";
import CollectionSeoLinks from "./_components/collection-seo-links";

async function getDocument(id: string) {
  const byCurrent = await prisma.document.findFirst({
    where: {
      published: true,
      OR: [{ slug: id }, { id }],
    },
  });
  if (byCurrent) {
    return { document: byCurrent, shouldRedirect: false as const };
  }

  const byOldSlug = await prisma.document.findFirst({
    where: { oldSlug: id, published: true },
  });
  if (byOldSlug) {
    return { document: byOldSlug, shouldRedirect: true as const };
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const result = await getDocument(params.id);
  if (!result) {
    return { title: "Documento no encontrado" };
  }
  const document = result.document;
  const name = document.name.trim();
  const nameWithHonduras = getHeadCodeDisplayTitle(document.slug, name);

  const title = buildSeoTitle(nameWithHonduras);
  const description = document.short_description
    ? buildSeoDescription(
        document.short_description,
        "Consulta el texto completo en Biblioteca Legal HN."
      )
    : buildSeoDescription(
        `Consulta el texto completo del ${nameWithHonduras} actualizado. Leyes y códigos de Honduras accesibles para abogados, estudiantes y ciudadanos.`
      );
  const ogDescription = buildSeoDescription(
    document.short_description?.trim() || `Texto completo del ${nameWithHonduras}`
  );
  const url = `https://www.bibliotecalegalhn.com/collections/${document.slug || document.id}`;
  return {
    title,
    description,
    keywords: [
      nameWithHonduras,
      name,
      `${name} Honduras`,
      `${name} texto completo`,
      `${name} actualizado`,
      "leyes Honduras",
      "códigos legales Honduras",
      "legislación hondureña",
      "Biblioteca Legal HN",
    ],
    openGraph: {
      title,
      description: ogDescription,
      url,
      siteName: "Biblioteca Legal HN",
      locale: "es_HN",
      type: "article",
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ogDescription,
      images: [SITE_OG_IMAGE],
    },
    alternates: {
      canonical: url,
    },
  };
}

const Page = async ({ params }: { params: { id: string } }) => {
  const cu = await auth();
  const isLoggedin = !!cu;
  const result = await getDocument(params.id);
  if (!result) notFound();
  if (result.shouldRedirect && result.document.slug) {
    redirect(`/collections/${result.document.slug}`);
  }
  const document = result.document;

  // Fire and forget - no bloquea el render
  prisma.document
    .update({
      where: { id: document.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  let hasSubscription = false;
  let freeChatRemaining = FREE_AI_CHAT_LIMIT;
  if (cu?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: cu.user.id },
      select: { role: true, freeChatUsed: true },
    });
    hasSubscription =
      user?.role === "admin" || (await isSubscribed());
    freeChatRemaining = Math.max(
      0,
      FREE_AI_CHAT_LIMIT - (user?.freeChatUsed ?? 0)
    );
  }

  // El texto completo del documento (secciones, capítulos y artículos) se
  // cachea con unstable_cache (ver @/lib/document-content). Antes se volvía
  // a pedir a Neon en cada visita; ahora se comparte entre visitas y solo
  // se refresca cada 10 minutos o cuando se invalida la tag del documento.
  const sections = await getDocumentSections(document.id);

  const name = document.name.trim();
  const head = getHeadCode(document.slug);
  const nameWithHonduras = getHeadCodeDisplayTitle(document.slug, name);
  const relatedGuides = document.slug
    ? getRelatedGuidesForCollection(document.slug)
    : [];

  // Última actualización legal publicada relacionada con este documento,
  // usada para la pregunta "¿cuál fue la última reforma?" del FAQ.
  const [latestUpdatePost, siblingDocs] = await Promise.all([
    prisma.legalUpdatePost.findFirst({
      where: { relatedDocumentId: document.id, status: "published" },
      orderBy: { publishedAt: "desc" },
      select: { title: true, slug: true, publishedAt: true },
    }),
    head
      ? prisma.document.findMany({
          where: {
            published: true,
            slug: { in: head.siblingSlugs },
          },
          select: { name: true, slug: true },
        })
      : Promise.resolve([]),
  ]);

  const siblingCodes: { name: string; slug: string }[] = [];
  for (const d of siblingDocs) {
    if (!d.slug) continue;
    siblingCodes.push({
      name: getHeadCodeDisplayTitle(d.slug, d.name),
      slug: d.slug,
    });
  }

  const faqs = getDocumentFaqs(
    { ...document, slug: document.slug },
    nameWithHonduras,
    latestUpdatePost
  );
  const documentUrl = `https://www.bibliotecalegalhn.com/collections/${document.slug || document.id}`;

  return (
    <div>
      {!hasSubscription && <AdSenseScript />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Legislation",
            name: nameWithHonduras,
            alternateName: name,
            description:
              document.short_description?.trim() ||
              `Texto completo del ${nameWithHonduras}`,
            url: documentUrl,
            inLanguage: "es-HN",
            jurisdictionOf: {
              "@type": "AdministrativeArea",
              name: "Honduras",
            },
            publisher: {
              "@type": "Organization",
              name: "Biblioteca Legal HN",
              url: "https://www.bibliotecalegalhn.com",
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
                item: "https://www.bibliotecalegalhn.com",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Colección",
                item: "https://www.bibliotecalegalhn.com/collections",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: nameWithHonduras,
                item: documentUrl,
              },
            ],
          }),
        }}
      />
      <CollectionHeader
        document={document}
        hasFullAccess={hasSubscription}
        isLoggedin={isLoggedin}
        displayTitle={nameWithHonduras}
        seoIntro={head?.seoIntro}
      />
      {!hasSubscription && (
        <FreePlanMeter freeChatRemaining={isLoggedin ? freeChatRemaining : null} />
      )}
      <ArticleContainer
        documentId={document.id}
        isLoggedin={isLoggedin}
        hasSubscription={hasSubscription}
        sections={sections}
      />
      <CollectionSeoLinks
        relatedGuides={relatedGuides}
        siblingCodes={siblingCodes}
      />
      <LawFaq faqs={faqs} />
      <LegalChatbot
        documentId={document.id}
        documentName={document.name.trim()}
        isLoggedin={isLoggedin}
        hasSubscription={hasSubscription}
        freeChatRemaining={freeChatRemaining}
      />
    </div>
  );
};

export default Page;
