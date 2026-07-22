import { prisma } from "@/lib/db";
import { UploadGacetasModal } from "./_components/UploadGacetasModal";
import { GacetaRowActions } from "./_components/GacetaRowActions";
import { ProcessNowButton } from "./_components/ProcessNowButton";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

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

const GacetasPage = async () => {
  const gacetas = await prisma.gaceta.findMany({
    orderBy: { uploadedAt: "desc" },
  });
  const hasPending = gacetas.some((g) => g.status === "pending");

  return (
    <div>
      <div className="w-full flex justify-between items-center mb-2">
        <h1 className="text-primary font-semibold text-[32px] leading-[120%]">
          Biblioteca de Gacetas
        </h1>
        <div className="flex items-center gap-2">
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
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">N° Gaceta</th>
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
                      <a href={g.pdfUrl} target="_blank" rel="noreferrer" className="hover:underline text-primary">
                        {g.number}
                      </a>
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
                        <GacetaRowActions id={g.id} status={g.status} />
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
