import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ArticleContainer from "./_components/article-container";
import CollectionHeader from "./_components/collection-header";

export const dynamic = "force-dynamic";

const Page = async ({ params }: { params: { id: string } }) => {
  const document = await prisma.document.findFirst({
    where: {
      OR: [
        { slug: params.id },
        { id: params.id },
      ],
    },
  });

  if (!document) notFound();

  return (
    <div>
      <CollectionHeader document={document} hasFullAccess={true} />
      <ArticleContainer documentId={document.id} isLoggedin={true} />
    </div>
  );
};

export default Page;
