import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ArticleContainer from "./_components/article-container";
import CollectionHeader from "./_components/collection-header";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const ids = await prisma.document.findMany({
    select: { id: true },
  });
  return ids;
}

const Page = async ({ params }: { params: { id: string } }) => {
  const document = await prisma.document.findUnique({
    where: { id: params.id },
  });

  if (!document) notFound();

  return (
    <div>
      <CollectionHeader document={document} hasFullAccess={true} />
      <ArticleContainer documentId={params.id} isLoggedin={true} />
    </div>
  );
};

export default Page;
