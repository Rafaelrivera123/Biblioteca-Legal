"use client";
import { Input } from "@/components/ui/input";
import { useArticleSearch, useSectionSearch } from "@/store/dashboard/document/section-search";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";

interface ArticleResult {
  id: string;
  articleNumber: number;
  articleLabel: string | null;
  display: string;
  sectionId: string;
  chapterId: string;
}

const SectionSearch = () => {
  const { setQuery: setSectionQuery, query: sectionQuery } = useSectionSearch();
  const { setQuery: setArticleQuery } = useArticleSearch();
  const [articleInput, setArticleInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const documentId = params.documentId as string;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleArticleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setArticleInput(val);
    setError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim()) return;

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/documents/${documentId}/articles`);
        const json = await res.json();
        const articles: ArticleResult[] = json.data ?? [];

        const target = articles.find(
          (a) => String(a.articleNumber) === val.trim()
        );

        if (!target) {
          setError(`Artículo ${val} no encontrado`);
          setLoading(false);
          return;
        }

        setArticleQuery(val.trim());
        router.push(
          `/dashboard/documents/${documentId}/${target.sectionId}/${target.chapterId}`
        );
      } catch {
        setError("Error buscando el artículo");
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  const clearArticle = () => {
    setArticleInput("");
    setError("");
    setArticleQuery("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  return (
    <div className="flex gap-2 items-start">
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

      <div className="relative flex flex-col gap-1">
        <div className="relative">
          <Input
            className="min-w-[160px] pr-8"
            value={articleInput}
            onChange={handleArticleChange}
            placeholder="Ir al artículo..."
            type="number"
            min={1}
          />
          {loading && (
            <Loader2 size={14} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
          )}
          {articleInput && !loading && (
            <button
              onClick={clearArticle}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {error && (
          <p className="text-[11px] text-red-500 absolute top-full mt-1 whitespace-nowrap">{error}</p>
        )}
      </div>
    </div>
  );
};

export default SectionSearch;
