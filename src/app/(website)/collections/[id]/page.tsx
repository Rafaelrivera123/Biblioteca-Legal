import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ArticleContainer from "./_components/article-container";
import CollectionHeader from "./_components/collection-header";

export const dynamic = "force-dynamic";

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
        sections={sections}
      />
    </div>
  );
};

export default Page;
