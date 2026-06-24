import HeaderSection from "@/components/shared/sections/header";
import { prisma } from "@/lib/db";
import CollectionFilter from "./_components/collection-filter";
import CollectionContainer from "./_components/collection-container";

export const dynamic = "force-dynamic";

const LIMIT = 12;

const Page = async () => {
  const [categories, documents, totalCount] = await Promise.all([
    prisma.category.findMany(),
    prisma.document.findMany({
      take: LIMIT,
      orderBy: { createdAt: "desc" },
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
