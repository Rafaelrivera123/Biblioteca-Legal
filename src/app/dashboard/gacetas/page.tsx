import { createElement } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { UploadGacetasModal } from "./_components/UploadGacetasModal";
import { GacetaRowActions } from "./_components/GacetaRowActions";
import { ProcessNowButton } from "./_components/ProcessNowButton";
import { ArrowDown, ArrowUp, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

// Con Fluid Compute (activado por defecto en Vercel), el plan Hobby permite
// hasta 300 segundos de duración — necesario porque "Procesar ahora" corre
// el mismo análisis con IA que el cron.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  pending: { label: "Pendiente", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
  processing: { label: "Procesando", icon: Loader2, color: "text-blue-600 bg-blue-50 border-blue-200" },
  processed: { label: "Procesada", icon: CheckCircle2, color: "text-green-600 bg-green-50 border-green-200" },
  failed: { label: "Falló", icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
} as const;

// El campo "number" es texto (ej. "37,169"), no numérico, así que un
// orderBy de Prisma sobre ese campo ordenaría como string ("9,000" antes
// que "37,169"). Se extraen solo los dígitos y se ordena en memoria.
const parseGacetaNumber = (value: string) => {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

const GacetasPage = async ({
  searchParams,
}: {
  searchParams?: { sort?: string };
}) => {
  const sortDir: "asc" | "desc" = searchParams?.sort === "asc" ? "asc" : "desc";

  // No seleccionamos pdfData aquí a propósito: son bytes pesados que no
  // hacen falta para listar, y traerlos todos de una vez en cada carga de
  // esta página sería carísimo. Se leen aparte solo al abrir el PDF
  // (ver /api/dashboard/gacetas/[id]/pdf).
  const gacetas = await prisma.gaceta.findMany({
    select: {
      id: true,
      number: true,
      fileName: true,
      fileAvailable: true,
      status: true,
      updatesCreated: true,
      errorMessage: true,
      description: true,
      uploadedAt: true,
      processedAt: true,
    },
  });

  gacetas.sort((a, b) => {
    const diff = parseGacetaNumber(a.number) - parseGacetaNumber(b.number);
    return sortDir === "asc" ? diff : -diff;
  });

  const hasPending = gacetas.some((g) => g.status === "pending");

  return (
    <div>
      <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
        <h1 className="text-primary font-semibold text-[26px] sm:text-[32px] leading-[120%]">
          Biblioteca de Gacetas
        </h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ProcessNowButton hasPending={hasPending} />
          <UploadGacetasModal />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6 max-w-[700px]">
        Sube aquí los PDFs de La Gaceta a medida que salen. El sistema las
        procesa automáticamente (lunes, miércoles y viernes) en orden de subida,
        generando entre 1 y 5 actualizaciones por Gaceta según su importancia
        real, sin repetir nunca la misma Gaceta dos veces.
      </p>

      {gacetas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no has subido ninguna Gaceta.
        </p>
      ) : (
        <div className="border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">
                  <Link
                    href={`/dashboard/gacetas?sort=${sortDir === "asc" ? "desc" : "asc"}`}
                    className="inline-flex items-center gap-1 hover:text-primary"
                    title={sortDir === "asc" ? "Ordenar descendente" : "Ordenar ascendente"}
                  >
                    N° Gaceta
                    {sortDir === "asc" ? (
                      <ArrowUp className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </Link>
                </th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Actualizaciones</th>
                <th className="px-4 py-3 font-medium">Subida</th>
                <th className="px-4 py-3 font-medium">Procesada</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gacetas.map((g) => {
                const config = STATUS_CONFIG[g.status];
                const Icon = config.icon;
                return (
                  <tr key={g.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      {/* createElement en vez de una etiqueta JSX de
                          ancla: algo en el flujo de pegado del usuario
                          hacia GitHub borra de forma determinística la
                          apertura de cualquier etiqueta de ancla pegada en
                          su editor web, dejando los atributos huérfanos y
                          rompiendo el build. Sin ese texto literal en el
                          archivo, no hay nada que ese filtro pueda
                          limpiar. */}
                      {g.fileAvailable ? (
                        createElement(
                          "a",
                          {
                            href: `/api/dashboard/gacetas/${g.id}/pdf`,
                            target: "_blank",
                            rel: "noreferrer",
                            className: "hover:underline text-primary",
                          },
                          g.number
                        )
                      ) : (
                        <span title="El PDF ya se borró tras procesarse">{g.number}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.color}`}>
                        <Icon className={`w-3.5 h-3.5 ${g.status === "processing" ? "animate-spin" : ""}`} />
                        {config.label}
                      </span>
                      {g.status === "failed" && g.errorMessage && (
                        <p className="text-xs text-red-500 mt-1 max-w-[280px]">{g.errorMessage}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {g.status === "processed" ? g.updatesCreated : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {g.uploadedAt.toLocaleDateString("es-HN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {g.processedAt
                        ? g.processedAt.toLocaleDateString("es-HN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <GacetaRowActions
                          id={g.id}
                          number={g.number}
                          status={g.status}
                          description={g.description}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GacetasPage;
