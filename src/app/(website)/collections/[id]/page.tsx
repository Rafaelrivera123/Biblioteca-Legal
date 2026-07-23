import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ArticleContainer from "./_components/article-container";
import CollectionHeader from "./_components/collection-header";
import LegalChatbot from "./_components/legal-chatbot";
import { getDocumentSections } from "@/lib/document-content";
import {
  SITE_OG_IMAGE,
  buildSeoDescription,
  buildSeoTitle,
} from "@/lib/seo";

async function getDocument(id: string) {
  return prisma.document.findFirst({
    where: {
      OR: [{ slug: id }, { id }],
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const document = await getDocument(params.id);
  if (!document) {
    return { title: "Documento no encontrado | Biblioteca Legal HN" };
  }
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
  const document = await getDocument(params.id);
  if (!document) notFound();

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
      select: {
        role: true,
        userSubscription: {
          select: { isActive: true, currentPeriodEnd: true },
        },
      },
    });
    if (user?.role === "admin") {
      hasSubscription = true;
    } else {
      hasSubscription = !!(
        user?.userSubscription?.isActive &&
        new Date(user.userSubscription.currentPeriodEnd) > new Date()
      );
    }
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

  return (
    <div>
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
            url: `https://www.bibliotecalegalhn.com/collections/${document.slug || document.id}`,
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
      <CollectionHeader
        document={document}
        hasFullAccess={true}
        isLoggedin={isLoggedin}
      />
      <ArticleContainer
        documentId={document.id}
        isLoggedin={isLoggedin}
        hasSubscription={hasSubscription}
        sections={sections}
      />
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
