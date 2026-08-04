import { auth } from "@/auth";
import AdSenseScript from "@/components/ads/AdSenseScript";
import { isSubscribed } from "@/helper/subscription";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import ArticleContainer from "./_components/article-container";
import CollectionHeader from "./_components/collection-header";
import LegalChatbot from "./_components/legal-chatbot";
import LawFaq from "./_components/law-faq";
import { getDocumentSections } from "@/lib/document-content";
import { getDocumentFaqs } from "@/lib/law-faqs";
import {
  SITE_OG_IMAGE,
  buildSeoDescription,
  buildSeoTitle,
} from "@/lib/seo";

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
  const nameWithHonduras = name.toLowerCase().includes("honduras")
    ? name
    : `${name} de Honduras`;

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
  if (cu?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: cu.user.id },
      select: { role: true },
    });
    hasSubscription =
      user?.role === "admin" || (await isSubscribed());
  }

  // El texto completo del documento (secciones, capítulos y artículos) se
  // cachea con unstable_cache (ver @/lib/document-content). Antes se volvía
  // a pedir a Neon en cada visita; ahora se comparte entre visitas y solo
  // se refresca cada 10 minutos o cuando se invalida la tag del documento.
  const sections = await getDocumentSections(document.id);

  const name = document.name.trim();
  const nameWithHonduras = name.toLowerCase().includes("honduras")
    ? name
    : `${name} de Honduras`;

  // Última actualización legal publicada relacionada con este documento,
  // usada para la pregunta "¿cuál fue la última reforma?" del FAQ.
  const latestUpdatePost = await prisma.legalUpdatePost.findFirst({
    where: { relatedDocumentId: document.id, status: "published" },
    orderBy: { publishedAt: "desc" },
    select: { title: true, slug: true, publishedAt: true },
  });

  const faqs = getDocumentFaqs(document, nameWithHonduras, latestUpdatePost);
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
      />
      <ArticleContainer
        documentId={document.id}
        isLoggedin={isLoggedin}
        hasSubscription={hasSubscription}
        sections={sections}
      />
      <LawFaq faqs={faqs} />
      <LegalChatbot
        documentId={document.id}
        documentName={document.name.trim()}
        isLoggedin={isLoggedin}
        hasSubscription={hasSubscription}
      />
    </div>
  );
};

export default Page;
