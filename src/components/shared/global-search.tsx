"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import useDebounce from "@/hooks/useDebounce";
import { SEARCH_HL_END, SEARCH_HL_START, type SearchResponse } from "@/lib/search-shared";
import { useArticleSearchStore } from "@/store/collections";
import { useGlobalSearchStore } from "@/store/search";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, Loader2, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * El snippet que devuelve /api/search trae SEARCH_HL_START/SEARCH_HL_END
 * alrededor del término encontrado (ver ts_headline en la ruta). Acá se
 * escapa todo el texto primero (para que ningún caracter del artículo se
 * interprete como HTML) y solo después se reemplazan esos marcadores por
 * <mark>, así que no hay forma de inyectar HTML desde el contenido legal.
 */
function renderSnippet(snippet: string): { __html: string } {
  const escaped = escapeHtml(snippet);
  const html = escaped
    .split(SEARCH_HL_START)
    .join('<mark class="bg-[#D4AF37]/30 text-inherit rounded-sm px-0.5">')
    .split(SEARCH_HL_END)
    .join("</mark>");
  return { __html: html };
}

const GlobalSearch = () => {
  const router = useRouter();
  const { isOpen, initialQuery, close, toggle, clearInitialQuery } = useGlobalSearchStore();
  const { setQuery: setArticleJumpQuery } = useArticleSearchStore();
  const [inputValue, setInputValue] = useState("");
  const debouncedValue = useDebounce(inputValue, 300);
  const trimmedDebounced = debouncedValue.trim();

  useEffect(() => {
    if (isOpen && initialQuery) {
      setInputValue(initialQuery);
      clearInitialQuery();
    }
  }, [isOpen, initialQuery, clearInitialQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  const { data, isFetching } = useQuery<SearchResponse>({
    queryKey: ["global-search", trimmedDebounced],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(trimmedDebounced)}&limit=8`).then((res) =>
        res.json()
      ),
    enabled: isOpen && trimmedDebounced.length >= 2,
    staleTime: 30_000,
  });

  const {
    data: semanticData,
    isFetching: isSemanticLoading,
    refetch: runSemanticSearch,
  } = useQuery<SearchResponse>({
    queryKey: ["global-search-semantic", trimmedDebounced],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(trimmedDebounced)}&mode=semantic&limit=8`).then(
        (res) => res.json()
      ),
    enabled: false,
    staleTime: 30_000,
  });

  const documents = data?.documents ?? [];
  const articles = data?.articles ?? [];
  const hasLiteralResults = documents.length + articles.length > 0;
  const showSemanticCta =
    !isFetching &&
    trimmedDebounced.length >= 3 &&
    !hasLiteralResults &&
    !semanticData &&
    !isSemanticLoading;

  const semanticArticles = useMemo(() => semanticData?.articles ?? [], [semanticData]);

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    close();
    setInputValue("");
  };

  const goToDocument = (slugOrId: string) => {
    handleOpenChange(false);
    router.push(`/collections/${slugOrId}`);
  };

  const goToArticle = (documentSlug: string | null, documentId: string, articleNumber: number) => {
    // Reutiliza el mecanismo que ya existe para "ir al artículo N" dentro
    // de /collections/[id]: fija el número en el store global y navega;
    // ArticleWrapper hace el scroll + resaltado automáticamente al montar.
    setArticleJumpQuery(String(articleNumber));
    handleOpenChange(false);
    router.push(`/collections/${documentSlug || documentId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="top-[15%] max-w-2xl translate-y-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Buscar en Biblioteca Legal</DialogTitle>
        <DialogDescription className="sr-only">
          Busca leyes, códigos o artículos por número, título o palabra clave
        </DialogDescription>
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder="Buscar por artículo, ley, decreto o palabra clave..."
            className="pr-8"
          />
          <CommandList className="max-h-[400px]">
            {isFetching && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            )}

            {!isFetching && trimmedDebounced.length > 0 && trimmedDebounced.length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Escribe al menos 2 caracteres
              </div>
            )}

            {!isFetching && trimmedDebounced.length >= 2 && (
              <>
                <CommandEmpty className="py-0">
                  {!hasLiteralResults && !showSemanticCta && !semanticArticles.length && (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No encontramos coincidencias exactas para &quot;{trimmedDebounced}&quot;.
                    </div>
                  )}
                </CommandEmpty>

                {documents.length > 0 && (
                  <CommandGroup heading="Leyes y códigos">
                    {documents.map((doc) => (
                      <CommandItem
                        key={`doc-${doc.id}`}
                        value={`doc-${doc.id}`}
                        onSelect={() => goToDocument(doc.slug || doc.id)}
                        className="flex flex-col items-start gap-0.5 py-2"
                      >
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <BookOpen className="h-4 w-4 shrink-0 text-[#D4AF37]" />
                          {doc.name}
                        </div>
                        {doc.short_description && (
                          <p className="line-clamp-1 pl-6 text-xs text-muted-foreground">
                            {doc.short_description}
                          </p>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {documents.length > 0 && articles.length > 0 && <CommandSeparator />}

                {articles.length > 0 && (
                  <CommandGroup heading="Artículos">
                    {articles.map((article) => (
                      <CommandItem
                        key={`art-${article.id}`}
                        value={`art-${article.id}`}
                        onSelect={() =>
                          goToArticle(article.documentSlug, article.documentId, article.articleNumber)
                        }
                        className="flex flex-col items-start gap-1 py-2"
                      >
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <FileText className="h-4 w-4 shrink-0 text-[#1E2A38]" />
                          Artículo {article.articleLabel ?? article.articleNumber} — {article.documentName}
                        </div>
                        {article.snippet && (
                          <p
                            className="line-clamp-2 pl-6 text-xs text-muted-foreground"
                            dangerouslySetInnerHTML={renderSnippet(article.snippet)}
                          />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {showSemanticCta && (
                  <div className="border-t px-4 py-4">
                    <p className="mb-2 text-xs text-muted-foreground">
                      No hay coincidencias literales. Puedes intentar una búsqueda en lenguaje
                      natural (ej. &quot;qué pasa si despiden a alguien sin justa causa&quot;).
                    </p>
                    <button
                      onClick={() => runSemanticSearch()}
                      className="flex items-center gap-2 rounded-md bg-[#1E2A38] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1E2A38]/90 transition-colors"
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
                  <CommandGroup heading="Resultados por significado (IA)">
                    {semanticArticles.map((article) => (
                      <CommandItem
                        key={`sem-${article.id}`}
                        value={`sem-${article.id}`}
                        onSelect={() =>
                          goToArticle(article.documentSlug, article.documentId, article.articleNumber)
                        }
                        className="flex flex-col items-start gap-1 py-2"
                      >
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <Sparkles className="h-4 w-4 shrink-0 text-purple-600" />
                          Artículo {article.articleLabel ?? article.articleNumber} — {article.documentName}
                        </div>
                        {article.snippet && (
                          <p className="line-clamp-2 pl-6 text-xs text-muted-foreground">
                            {article.snippet}
                          </p>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {!isSemanticLoading &&
                  semanticData &&
                  semanticArticles.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Tampoco encontramos nada relacionado con eso. Prueba con otras palabras.
                    </div>
                  )}
              </>
            )}

            {trimmedDebounced.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Search className="h-4 w-4" />
                Busca por número de artículo, nombre de la ley, número de decreto o cualquier
                palabra dentro del texto.
              </div>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
