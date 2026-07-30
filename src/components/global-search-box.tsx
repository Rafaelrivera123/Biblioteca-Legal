"use client";
import { Input } from "@/components/ui/input";
import useDebounce from "@/hooks/useDebounce";
import useOutsideClick from "@/hooks/useOutsideClick";
import { highlightSnippet, type SearchResponse } from "@/lib/search-shared";
import { useArticleSearchStore } from "@/store/collections";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, Loader2, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface Props {
  placeholder?: string;
}

/**
 * Buscador completo (leyes, artículos y respaldo semántico con IA) sin
 * acotar a un documento — busca en toda la biblioteca. Usado en la tarjeta
 * "Herramientas de Investigación" del home. A diferencia de
 * document-search.tsx, aquí un resultado puede estar en cualquier ley, así
 * que al seleccionar uno se navega a /collections/[slug] (y si es un
 * artículo, se fija el número en el store global para que la página de
 * destino haga scroll + resaltado automáticamente al montar).
 */
const GlobalSearchBox = ({ placeholder = "Buscar en toda la biblioteca..." }: Props) => {
  const router = useRouter();
  const { setQuery: setArticleJumpQuery } = useArticleSearchStore();
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(value, 300);
  const trimmed = debounced.trim();

  useOutsideClick(containerRef, () => setIsOpen(false));

  const { data, isFetching } = useQuery<SearchResponse>({
    queryKey: ["global-search-box", trimmed],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=8`).then((res) => res.json()),
    enabled: isOpen && trimmed.length >= 2,
    staleTime: 30_000,
  });

  const {
    data: semanticData,
    isFetching: isSemanticLoading,
    refetch: runSemanticSearch,
  } = useQuery<SearchResponse>({
    queryKey: ["global-search-box-semantic", trimmed],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}&mode=semantic&limit=8`).then((res) =>
        res.json()
      ),
    enabled: false,
    staleTime: 30_000,
  });

  const documents = data?.documents ?? [];
  const articles = data?.articles ?? [];
  const hasResults = documents.length + articles.length > 0;
  const semanticArticles = semanticData?.articles ?? [];
  const showSemanticCta =
    !isFetching &&
    trimmed.length >= 3 &&
    !hasResults &&
    !semanticData &&
    !isSemanticLoading;

  const goToDocument = (slugOrId: string) => {
    setIsOpen(false);
    router.push(`/collections/${slugOrId}`);
  };

  const goToArticle = (documentSlug: string | null, documentId: string, articleNumber: number) => {
    setArticleJumpQuery(String(articleNumber));
    setIsOpen(false);
    router.push(`/collections/${documentSlug || documentId}`);
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <Input
        startIcon={Search}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (value.trim().length >= 2) setIsOpen(true);
        }}
      />

      {isOpen && trimmed.length > 0 && trimmed.length < 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white p-3 text-center text-xs text-muted-foreground shadow-lg">
          Escribe al menos 2 caracteres
        </div>
      )}

      {isOpen && trimmed.length >= 2 && (
        <div className="absolute z-50 mt-1 max-h-[400px] w-full overflow-y-auto rounded-md border bg-white shadow-lg">
          {isFetching && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          )}

          {!isFetching && documents.length > 0 && (
            <div className="py-1">
              <p className="px-3 pt-2 text-xs font-semibold text-muted-foreground">
                Leyes y códigos
              </p>
              {documents.map((doc) => (
                <button
                  key={`doc-${doc.id}`}
                  type="button"
                  onClick={() => goToDocument(doc.slug || doc.id)}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted/60"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <BookOpen className="h-4 w-4 shrink-0 text-[#D4AF37]" />
                    {doc.name}
                  </span>
                  {doc.short_description && (
                    <p className="line-clamp-1 pl-6 text-xs text-muted-foreground">
                      {doc.short_description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {!isFetching && articles.length > 0 && (
            <div className="border-t py-1">
              <p className="px-3 pt-2 text-xs font-semibold text-muted-foreground">Artículos</p>
              {articles.map((article) => (
                <button
                  key={`art-${article.id}`}
                  type="button"
                  onClick={() =>
                    goToArticle(article.documentSlug, article.documentId, article.articleNumber)
                  }
                  className="flex w-full flex-col items-start gap-1 px-3 py-2 text-left hover:bg-muted/60"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="h-4 w-4 shrink-0 text-[#1E2A38]" />
                    Artículo {article.articleLabel ?? article.articleNumber} —{" "}
                    {article.documentName}
                  </span>
                  {article.snippet && (
                    <p
                      className="line-clamp-2 pl-6 text-xs text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: highlightSnippet(article.snippet) }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {!isFetching && !hasResults && !showSemanticCta && !semanticArticles.length && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No encontramos coincidencias exactas para &quot;{trimmed}&quot;.
            </div>
          )}

          {showSemanticCta && (
            <div className="border-t px-3 py-3">
              <p className="mb-2 text-xs text-muted-foreground">
                Prueba una búsqueda en lenguaje natural (ej. &quot;qué pasa si despiden a
                alguien sin justa causa&quot;).
              </p>
              <button
                type="button"
                onClick={() => runSemanticSearch()}
                className="flex items-center gap-2 rounded-md bg-[#1E2A38] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1E2A38]/90"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Buscar con IA
              </button>
            </div>
          )}

          {isSemanticLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analizando tu pregunta...
            </div>
          )}

          {!isSemanticLoading && semanticArticles.length > 0 && (
            <div className="border-t py-1">
              <p className="px-3 pt-2 text-xs font-semibold text-muted-foreground">
                Resultados por significado (IA)
              </p>
              {semanticArticles.map((article) => (
                <button
                  key={`sem-${article.id}`}
                  type="button"
                  onClick={() =>
                    goToArticle(article.documentSlug, article.documentId, article.articleNumber)
                  }
                  className="flex w-full flex-col items-start gap-1 px-3 py-2 text-left hover:bg-muted/60"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Sparkles className="h-4 w-4 shrink-0 text-purple-600" />
                    Artículo {article.articleLabel ?? article.articleNumber} —{" "}
                    {article.documentName}
                  </span>
                  {article.snippet && (
                    <p className="line-clamp-2 pl-6 text-xs text-muted-foreground">
                      {article.snippet}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {!isSemanticLoading && semanticData && semanticArticles.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Tampoco encontramos nada relacionado con eso.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBox;
