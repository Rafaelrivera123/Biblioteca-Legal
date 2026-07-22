import HeaderSection from "@/components/shared/sections/header";
import { prisma } from "@/lib/db";
import CollectionFilter from "./_components/collection-filter";
import CollectionContainer from "./_components/collection-container";
import { Metadata } from "next";
import Link from "next/link";

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
  const [categories, documents, totalCount, allPublishedDocuments] = await Promise.all([
    prisma.category.findMany(),
    prisma.document.findMany({
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      include: { categories: true },
    }),
    prisma.document.count(),
    // Se usa solo para renderizar un índice completo con enlaces internos
    // reales (server-rendered) hacia cada documento. El grid de arriba es
    // interactivo (búsqueda/paginación client-side) y por sí solo deja sin
    // ningún enlace interno rastreable a los documentos que no caen en la
    // primera página — este índice soluciona ese problema de "orphan pages".
    prisma.document.findMany({
      where: { published: true },
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    }),
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

      {allPublishedDocuments.length > 0 && (
        <section
          aria-label="Índice completo de leyes y códigos"
          className="container py-16 border-t"
        >
          <h2 className="text-xl font-semibold mb-6">
            Índice completo de leyes y códigos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            {allPublishedDocuments.map((doc) => (
              <Link
                key={doc.id}
                href={`/collections/${doc.slug || doc.id}`}
                className="text-sm text-muted-foreground hover:text-primary hover:underline truncate"
              >
                {doc.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Page;
