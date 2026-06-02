"use client";
import { useArticleSearchStore } from "@/store/collections";
import { Article } from "@prisma/client";
import { memo, useEffect, useRef, useState } from "react";
import ArticleCard from "./article-card";

interface Props {
  data: Article[];
  isLoggedin: boolean;
  hasSubscription: boolean;
  documentId: string;
}

function sortArticles(articles: Article[]): Article[] {
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

const ArticleWrapper = ({ data, isLoggedin, hasSubscription, documentId }: Props) => {
  const { query, setQuery } = useArticleSearchStore();
  const [highlightedArticle, setHighlightedArticle] = useState<number | null>(null);
  const articleRefs = useRef<(HTMLDivElement | null)[]>([]);

  const sortedData = sortArticles(data);

  useEffect(() => {
    if (!query) return;
    const searchNumber = parseInt(query.trim(), 10);
    if (!isNaN(searchNumber)) {
      const targetIndex = sortedData.findIndex(
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

          // Limpiar query después del scroll para no bloquear el scroll libre
          setTimeout(() => {
            setQuery("");
            setHighlightedArticle(null);
          }, 1500);
        }
      }
    }
  }, [query, sortedData, setQuery]);

  return (
    <div className="space-y-5">
      {sortedData?.map((item, i) => (
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
            hasSubscription={hasSubscription}
            documentId={documentId}
            highlightedArticle={highlightedArticle}
          />
        </div>
      ))}
    </div>
  );
};

export default memo(ArticleWrapper);
