import AddArticleModal from "@/components/shared/modals/add-article-modal";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import moment from "moment";
import { notFound } from "next/navigation";
import BackNow from "../../../_components/back-now";
import ArticleContainer from "./_components/article-container";

const Page = async ({
  params,
}: {
  params: { documentId: string; sectionId: string; chapterId: string };
}) => {
  const documentId = params.documentId;

  const document = await prisma.document.findFirst({
    where: { id: documentId },
  });

  const section = await prisma.section.findFirst({
    where: {
      id: params.sectionId,
      documentId: documentId,
    },
  });

  const chapter = await prisma.chapter.findFirst({
    where: {
      id: params.chapterId,
      sectionId: params.sectionId,
    },
  });

  if (!document) notFound();

  const articles = await prisma.article.findMany({
    where: { chapterId: params.chapterId },
  });

  // Incrementa viewCount de todos los artículos del capítulo al visitarlo
  if (articles.length > 0) {
    await prisma.article.updateMany({
      where: { chapterId: params.chapterId },
      data: { viewCount: { increment: 1 } },
    });
  }

  return (
    <div className="space-y-[30px]">
      <BackNow />
      <section className="flex justify-between items-start">
        <div className="space-y-[15px]">
          <h1 className="font-bold text-[24px] leading-[120%]">
            {document.name}
          </h1>
          <p className="font-medium leading-[120%]">
            {document.short_description}
          </p>
          <p className="leading-[120%]">
            Law No.{" "}
            <span className="font-semibold">{document.law_number}</span>
          </p>
          <p>
            Published:{" "}
            <span className="font-semibold">
              {moment(document.createdAt).format("MMMM D, YYYY")}
            </span>
          </p>
          <p>
            Title Name:{" "}
            <span className="font-semibold">
              {section?.title || "No title available"}
            </span>
          </p>
          <p>
            Chapter Title:{" "}
            <span className="font-semibold">
              {chapter?.title || "No title available"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-x-[30px]">
          <AddArticleModal
            trigger={<Button>Add Article</Button>}
            chapterId={params.chapterId}
            documentId={params.documentId}
            sectionId={params.sectionId}
          />
        </div>
      </section>
      <ArticleContainer
        chapterId={params.chapterId}
        sectionId={params.sectionId}
        documentId={params.documentId}
        articles={articles}
      />
    </div>
  );
};

export default Page;
