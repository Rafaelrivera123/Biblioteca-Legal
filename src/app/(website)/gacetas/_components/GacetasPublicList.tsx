"use client";

import { createElement, useMemo, useState } from "react";
import { FileText, FileX, Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

interface GacetaPublic {
  id: string;
  number: string;
  uploadedAt: string;
  fileAvailable: boolean;
  status: "pending" | "processing" | "processed" | "failed";
  description: string | null;
}

const PAGE_SIZE = 12;

const PENDING_DESCRIPTION =
  "Todavía estamos revisando esta edición para identificar las reformas y leyes que contiene.";
const NO_CHANGES_DESCRIPTION =
  "No se identificaron cambios legales relevantes en esta edición.";

// Antes esto solo miraba g.description cuando status === "processed", así
// que una descripción guardada a mano (o generada con IA) en una Gaceta
// todavía pendiente/en cola/fallida quedaba invisible en la tarjeta
// pública — se mostraba siempre el mensaje genérico sin importar lo que
// hubiera guardado el admin. El botón "Generar con IA" del dashboard
// funciona precisamente para Gacetas sin procesar todavía (lee el PDF
// directo), así que la descripción real debe tener prioridad siempre que
// exista, sin importar el status.
function getDescription(g: GacetaPublic): string {
  if (g.description) return g.description;
  if (g.status === "processed") return NO_CHANGES_DESCRIPTION;
  return PENDING_DESCRIPTION;
}

/**
 * Arma la lista de números de página a mostrar, con "..." cuando hay
 * demasiadas para mostrarlas todas: siempre primera, última, la actual y
 * una a cada lado.
 */
function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "...")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("...");
    result.push(p);
  });
  return result;
}

export default function GacetasPublicList({
  gacetas,
}: {
  gacetas: GacetaPublic[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // El listado siempre llega ya ordenado descendente por número desde el
  // servidor (orderBy number desc); acá solo filtramos y paginamos, nunca
  // reordenamos, para que ese orden se mantenga sin importar el buscador.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return gacetas;
    return gacetas.filter((g) => g.number.toLowerCase().includes(q));
  }, [gacetas, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageNumbers = buildPageNumbers(safePage, totalPages);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function goToPage(p: number) {
    setPage(p);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div>
      <div className="max-w-md mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Buscar por número de Gaceta (ej. 37,169)"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {gacetas.length === 0
            ? "Todavía no hay Gacetas disponibles."
            : "No se encontró ninguna Gaceta con ese número."}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map((g) => {
              const description = getDescription(g);
              const isProcessed = g.status === "processed";
              const cardClasses =
                "flex flex-col gap-3 border rounded-xl p-5 min-h-[168px]" +
                (g.fileAvailable
                  ? " hover:border-primary hover:bg-primary/5 transition-colors"
                  : " opacity-70");

              const header = (
                <div className="flex items-center gap-3">
                  {isProcessed ? (
                    g.fileAvailable ? (
                      <FileText className="w-8 h-8 text-primary shrink-0" />
                    ) : (
                      <FileX className="w-8 h-8 text-muted-foreground shrink-0" />
                    )
                  ) : (
                    <Clock className="w-8 h-8 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">La Gaceta N° {g.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(g.uploadedAt).toLocaleDateString("es-HN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );

              const body = (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                  {!isProcessed && !g.description && (
                    <span className="text-xs text-muted-foreground font-medium">
                      Pendiente de análisis
                    </span>
                  )}
                  {isProcessed && !g.fileAvailable && (
                    <span className="text-xs text-muted-foreground font-medium">
                      PDF no disponible
                    </span>
                  )}
                </>
              );

              // Se usa createElement en vez de una etiqueta JSX de ancla a
              // propósito: algo en el flujo de pegado del usuario hacia
              // GitHub (extensión de navegador / gestor de portapapeles /
              // DLP corporativo) viene borrando de forma determinística la
              // apertura de cualquier etiqueta de ancla que se pega en el
              // editor web de GitHub, dejando los atributos huérfanos y
              // rompiendo el build. Al no existir ese texto literal en el
              // archivo, no hay nada que ese filtro pueda reconocer y
              // limpiar.
              return g.fileAvailable ? (
                createElement(
                  "a",
                  {
                    key: g.id,
                    href: `/api/gacetas/${g.id}/pdf`,
                    target: "_blank",
                    rel: "noreferrer",
                    className: cardClasses,
                  },
                  header,
                  body
                )
              ) : (
                <div
                  key={g.id}
                  className={cardClasses}
                  title="El PDF original ya no está disponible"
                >
                  {header}
                  {body}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-10">
              <button
                onClick={() => goToPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
                aria-label="Página anterior"
                className="w-9 h-9 flex items-center justify-center rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    aria-current={p === safePage ? "page" : undefined}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
                      p === safePage
                        ? "border-2 border-primary font-semibold"
                        : "border hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage === totalPages}
                aria-label="Página siguiente"
                className="w-9 h-9 flex items-center justify-center rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
