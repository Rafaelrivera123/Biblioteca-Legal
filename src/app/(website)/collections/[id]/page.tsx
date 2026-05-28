import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ArticleContainer from "./_components/article-container";
import CollectionHeader from "./_components/collection-header";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const document = await prisma.document.findFirst({
    where: {
      OR: [
        { slug: params.id },
        { id: params.id },
      ],
    },
  });
  if (!document) {
    return {
      title: "Documento no encontrado | Biblioteca Legal HN",
    };
  }
  return {
    title: `${document.name} | Biblioteca Legal HN`,
    description: document.short_description
      ? `${document.short_description} Consulta el texto completo de ${document.name} en Biblioteca Legal HN.`
      : `Consulta el texto completo de ${document.name} en Biblioteca Legal HN. Leyes y códigos de Honduras actualizados.`,
    openGraph: {
      title: `${document.name} | Biblioteca Legal HN`,
      description: document.short_description || `Texto completo de ${document.name}`,
      url: `https://www.bibliotecalegalhn.com/collections/${document.slug || document.id}`,
      siteName: "Biblioteca Legal HN",
      locale: "es_HN",
      type: "article",
    },
    alternates: {
      canonical: `https://www.bibliotecalegalhn.com/collections/${document.slug || document.id}`,
    },
  };
}

const Page = async ({ params }: { params: { id: string } }) => {
  const cu = await auth();
  const isLoggedin = !!cu;

  const document = await prisma.document.findFirst({
    where: {
      OR: [
        { slug: params.id },
        { id: params.id },
      ],
    },
  });

  if (!document) notFound();

  // Check subscription status
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

  const sections = await prisma.section.findMany({
    where: { documentId: document.id },
    include: {
      chapters: {
        include: {
          articles: { orderBy: { articleNumber: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <CollectionHeader document={document} hasFullAccess={true} />
      <ArticleContainer
        documentId={document.id}
        isLoggedin={isLoggedin}
        hasSubscription={hasSubscription}
        sections={sections}
      />
    </div>
  );
};

export default Page;
