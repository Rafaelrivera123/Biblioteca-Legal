"use client";
import { Prisma } from "@prisma/client";
import { useEffect } from "react";
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

const ArticleContainer = ({ documentId, isLoggedin, hasSubscription, sections }: Props) => {
  useEffect(() => {
    if (documentId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [documentId]);

  return (
    <div className="container min-h-[calc(100vh-600px)]">
      <div className="flex gap-8 items-start">
        {/* Índice lateral izquierdo */}
        <DocumentIndex sections={sections} />

        {/* Contenido principal */}
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
