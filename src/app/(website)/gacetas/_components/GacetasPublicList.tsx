"use client";

import { useMemo, useState } from "react";
import { FileText, FileX, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface GacetaPublic {
  id: string;
  number: string;
  uploadedAt: string;
  fileAvailable: boolean;
  updatesCount: number;
}

export default function GacetasPublicList({
  gacetas,
}: {
  gacetas: GacetaPublic[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return gacetas;
    return gacetas.filter((g) => g.number.toLowerCase().includes(q));
  }, [gacetas, query]);

  return (
    <div>
      <div className="max-w-md mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) =>
            g.fileAvailable ? (
              <a key={g.id} href={`/api/gacetas/${g.id}/pdf`} target="_blank" rel="noreferrer" className="flex items-center gap-3 border rounded-xl p-4 hover:border-primary hover:bg-primary/5 transition-colors">
                <FileText className="w-8 h-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">La Gaceta N° {g.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(g.uploadedAt).toLocaleDateString("es-HN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {g.updatesCount > 0 && (
                    <p className="text-xs text-primary mt-1">
                      {g.updatesCount}{" "}
                      {g.updatesCount === 1
                        ? "actualización legal"
                        : "actualizaciones legales"}
                    </p>
                  )}
                </div>
              </a>
            ) : (
              <div key={g.id} className="flex items-center gap-3 border rounded-xl p-4 opacity-60" title="El PDF original ya no está disponible, pero puedes ver el análisis en Actualizaciones">
                <FileX className="w-8 h-8 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">La Gaceta N° {g.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(g.uploadedAt).toLocaleDateString("es-HN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF no disponible
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
