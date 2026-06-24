import HeaderSection from "@/components/shared/sections/header";
import { prisma } from "@/lib/db";
import CollectionFilter from "./_components/collection-filter";
import CollectionContainer from "./_components/collection-container";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Colección de Leyes y Códigos | Biblioteca Legal HN",
  description:
    "Accede a la colección completa de leyes, códigos, decretos y reglamentos de Honduras. Constitución Política, Código Penal, Código Civil y más, actualizados y de fácil acceso.",
  keywords: [
    "leyes Honduras",
    "códigos legales Honduras",
    "legislación hondureña",
    "Código Penal Honduras",
    "Código Civil Honduras",
    "Constitución de Honduras",
    "decretos Honduras",
    "reglamentos Honduras",
    "biblioteca jurídica Honduras",
  ],
  openGraph: {
    title: "Colección de Leyes y Códigos | Biblioteca Legal HN",
    description:
      "Accede a la colección completa de leyes, códigos, decretos y reglamentos de Honduras.",
    url: "https://www.bibliotecalegalhn.com/collections",
    siteName: "Biblioteca Legal HN",
    locale: "es_HN",
    type: "website",
  },
  alternates: {
    canonical: "https://www.bibliotecalegalhn.com/collections",
  },
};

const LIMIT = 12;

const Page = async () => {
  const [categories, documents, totalCount] = await Promise.all([
    prisma.category.findMany(),
    prisma.document.findMany({
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      include: { categories: true },
    }),
    prisma.document.count(),
  ]);

  const initialData = {
    data: documents,
    meta: {
      totalPages: Math.ceil(totalCount / LIMIT),
      total: totalCount,
      page: 1,
    },
  };

  return (
    <div>
      <HeaderSection
        imageUrl="https://files.edgestore.dev/ln9m9j3kr2yibrue/staticFiled/_public/86f8cacd-d2d6-42df-a1bd-569b2c5e047c.webp"
        title="Colección de Documentos Legales"
        description="Explore nuestra colección actualizada de leyes, decretos y documentos legales"
      />
      <div>
        <CollectionFilter categories={categories} />
      </div>
      <CollectionContainer initialData={initialData} />
    </div>
  );
};

export default Page;
