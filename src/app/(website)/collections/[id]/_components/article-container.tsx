"use client";
import { Prisma, UserArticleMeta } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import ArticleHeader from "./article-header";
import ArticleWrapper from "./article-wrapper";
import DocumentIndex from "./document-index";
export type FullSectionResponse = Prisma.SectionGetPayload<{
  include: {
    chapters: {
      include: {
        articles: true;
      };
    };
  };
}>;
interface Props {
  documentId: string;
  isLoggedin: boolean;
  hasSubscription: boolean;
  sections: FullSectionResponse[];
}
function sortArticlesForOrder(articles: { id: string; articleNumber: number; articleLabel: string | null }[]) {
  return [...articles].sort((a, b) => {
    if (a.articleNumber !== b.articleNumber) {
      return a.articleNumber - b.articleNumber;
    }
    const labelA = a.articleLabel ?? "";
    const labelB = b.articleLabel ?? "";
    if (!labelA && labelB) return -1;
    if (labelA && !labelB) return 1;
    return labelA.localeCompare(labelB);
  });
}
const ArticleContainer = ({
  documentId,
  isLoggedin,
  hasSubscription,
  sections,
}: Props) => {
  const allArticleIds = useMemo(
    () =>
      sections.flatMap((section) =>
        section.chapters.flatMap((chapter) =>
          chapter.articles.map((a) => a.id)
        )
      ),
    [sections]
  );
  // Calcula el orden global de cada artículo en todo el documento,
  // para determinar cuáles caen dentro de los primeros N artículos gratis.
  const globalOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    let counter = 0;
    sections.forEach((section) => {
      section.chapters.forEach((chapter) => {
        const sorted = sortArticlesForOrder(chapter.articles);
        sorted.forEach((article) => {
          map.set(article.id, counter);
          counter += 1;
        });
      });
    });
    return map;
  }, [sections]);
  const { data: metaMapRes, isLoading: isMetaLoading } = useQuery<{
    success: boolean;
    data: Record<string, UserArticleMeta>;
  }>({
    queryKey: ["meta-batch", documentId],
    queryFn: () =>
      fetch("/api/article-meta-data/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: allArticleIds }),
      }).then((res) => res.json()),
    enabled: hasSubscription && allArticleIds.length > 0,
  });
  const metaMap = metaMapRes?.data ?? {};
  useEffect(() => {
    if (documentId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [documentId]);
  return (
    <div className="container min-h-[calc(100vh-600px)]">
      <div className="flex gap-8 items-start relative">
        <div className="hidden lg:block w-[260px] shrink-0 self-start sticky top-[80px]">
          <DocumentIndex sections={sections} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="space-y-[100px] mb-[100px]">
            {sections.map((section) => (
              <div key={section.id} className="space-y-[80px]">
                {section.chapters.map((chapter, cId) => {
                  const isFirstChapter = cId === 0;
                  return (
                    <div key={chapter.id} id={`chapter-${chapter.id}`}>
                      <ArticleHeader
                        sectionTitle={isFirstChapter ? section.title : ""}
                        chapterTitle={chapter.title}
                      />
                      <ArticleWrapper
                        data={chapter.articles}
                        isLoggedin={isLoggedin}
                        hasSubscription={hasSubscription}
                        documentId={documentId}
                        chapterId={chapter.id}
                        metaMap={metaMap}
                        isMetaLoading={isMetaLoading}
                        globalOrderMap={globalOrderMap}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ArticleContainer;
