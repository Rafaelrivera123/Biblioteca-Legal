"use client";
import { useArticleSearchStore } from "@/store/collections";
import { Article } from "@prisma/client";
import { memo, useEffect, useRef, useState } from "react";
import ArticleCard from "./article-card";

interface Props {
  data: Article[];
  isLoggedin: boolean;
  documentId: string;
}

const ArticleWrapper = ({ data, isLoggedin, documentId }: Props) => {
  const { query } = useArticleSearchStore();
  const [highlightedArticle, setHighlightedArticle] = useState<number | null>(null);
  const articleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const searchNumber = parseInt(query.trim(), 10);
    if (!isNaN(searchNumber)) {
      const targetIndex = data.findIndex(
        (article) => article.articleNumber === searchNumber
      );
      if (targetIndex !== -1) {
        const target = articleRefs.current[targetIndex];
        if (target) {
          const yOffset = -80;
          const y =
            target.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
          setHighlightedArticle(searchNumber);
          const timeout = setTimeout(() => {
            setHighlightedArticle(null);
          }, 1200);
          return () => clearTimeout(timeout);
        }
      }
    }
  }, [query, data]);

  return (
    <div className="space-y-5">
      {data?.map((item, i) => (
        <div
          key={item.id}
          ref={(el) => {
            articleRefs.current[i] = el;
          }}
        >
          <ArticleCard
            data={item}
            index={i}
            isLoggedin={isLoggedin}
            documentId={documentId}
            highlightedArticle={highlightedArticle}
          />
        </div>
      ))}
    </div>
  );
};

export default memo(ArticleWrapper);
