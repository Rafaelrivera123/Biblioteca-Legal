"use client";
import { Input } from "@/components/ui/input";
import { useSectionSearch, useArticleSearch } from "@/store/dashboard/document/section-search";
import { X } from "lucide-react";

const SectionSearch = () => {
  const { setQuery: setSectionQuery, query: sectionQuery } = useSectionSearch();
  const { setQuery: setArticleQuery, query: articleQuery } = useArticleSearch();

  return (
    <div className="flex gap-2">
      <div className="relative">
        <Input
          className="min-w-[300px]"
          value={sectionQuery}
          onChange={(e) => setSectionQuery(e.target.value)}
          placeholder="Search by Section title, chapter title..."
        />
        {sectionQuery && (
          <button
            onClick={() => setSectionQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="relative">
        <Input
          className="min-w-[180px]"
          value={articleQuery}
          onChange={(e) => setArticleQuery(e.target.value)}
          placeholder="Ir al artículo..."
          type="number"
          min={1}
        />
        {articleQuery && (
          <button
            onClick={() => setArticleQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SectionSearch;
