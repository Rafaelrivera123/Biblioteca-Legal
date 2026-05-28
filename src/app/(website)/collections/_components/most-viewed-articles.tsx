"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Eye, BookOpen } from "lucide-react";

interface ArticleWithContext {
  id: string;
  articleNumber: number;
  contentPlainText: string;
  viewCount: number;
  _count: { userMeta: number };
  chapter: {
    id: string;
    section: {
      id: string;
      document: {
        id: string;
        name: string;
      };
    };
  };
}

const MostViewedArticles = () => {
  const { data: articles, isLoading } = useQuery<ArticleWithContext[]>({
    queryKey: ["most-viewed-articles"],
    queryFn: () =>
      fetch("/api/articles/most-viewed").then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="mt-12">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[140px] bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!articles || !Array.isArray(articles) || articles.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Eye className="text-primary" size={20} />
        <h2 className="text-[20px] font-semibold text-primary">
          Artículos más vistos
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/dashboard/documents/${article.chapter.section.document.id}/${article.chapter.section.id}/${article.chapter.id}`}
            className="group border border-black/10 rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all bg-white"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[12px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Artículo {article.articleNumber}
              </span>
              <div className="flex items-center gap-1 text-gray-400 text-[12px]">
                <Eye size={12} />
                <span>
                  {article.viewCount > 0
                    ? article.viewCount
                    : article._count.userMeta}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-2">
              <BookOpen size={12} className="text-gray-400 shrink-0" />
              <p className="text-[12px] text-gray-500 truncate">
                {article.chapter.section.document.name}
              </p>
            </div>
            <p className="text-[13px] text-gray-700 line-clamp-3 leading-[1.6]">
              {article.contentPlainText.slice(0, 150)}...
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MostViewedArticles;
