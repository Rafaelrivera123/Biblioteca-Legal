"use client";
import { useActiveChapterStore, useArticleSearchStore } from "@/store/collections";
import { Article, UserArticleMeta } from "@prisma/client";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import ArticleCard from "./article-card";

const ADSENSE_CLIENT = "ca-pub-5685390714020326";
const ADSENSE_SLOT = "6259496363";
const AD_EVERY_N_ARTICLES = 15;

interface Props {
  data: Article[];
  isLoggedin: boolean;
  hasSubscription: boolean;
  documentId: string;
  chapterId: string;
  metaMap: Record<string, UserArticleMeta>;
  isMetaLoading: boolean;
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

const AdBanner = () => {
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="my-4 flex justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

const ArticleWrapper = ({
  data,
  isLoggedin,
  hasSubscription,
  documentId,
  chapterId,
  metaMap,
  isMetaLoading,
}: Props) => {
  const { query, setQuery } = useArticleSearchStore();
  const { setActiveChapterId } = useActiveChapterStore();
  const [highlightedArticle, setHighlightedArticle] = useState<number | null>(null);
  const articleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sortedData = useMemo(() => sortArticles(data), [data]);

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
          const elementHeight = target.getBoundingClientRect().height;
          const windowHeight = window.innerHeight;
          const yOffset = -(windowHeight / 2) + elementHeight / 2;
          const y =
            target.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
          setHighlightedArticle(searchNumber);
          setActiveChapterId(chapterId);
          setTimeout(() => {
            setQuery("");
            setHighlightedArticle(null);
          }, 1500);
        }
      }
    }
  }, [query, sortedData, setQuery, chapterId, setActiveChapterId]);

  return (
    <div className="space-y-5">
      {sortedData?.map((item, i) => (
        <div key={item.id}>
          <div
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
              initialMeta={metaMap[item.id] ?? null}
              isMetaLoading={isMetaLoading}
            />
          </div>
          {!hasSubscription && (i + 1) % AD_EVERY_N_ARTICLES === 0 && (
            <AdBanner key={`ad-${i}`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default memo(ArticleWrapper);
