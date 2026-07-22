"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { processGacetasNow } from "../actions";

export function ProcessNowButton({ hasPending }: { hasPending: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(() => {
      processGacetasNow()
        .then((summary) => {
          if (summary.length === 0) {
            toast.info("No había Gacetas pendientes por procesar.");
            return;
          }
          const ok = summary.filter((s) => s.ok);
          const failed = summary.filter((s) => !s.ok);
          const totalUpdates = ok.reduce((sum, s) => sum + s.updatesCreated, 0);
          toast.success(
            `Procesadas ${ok.length} Gaceta${ok.length !== 1 ? "s" : ""} — ${totalUpdates} actualización(es) creada(s) como borrador.`
          );
          if (failed.length > 0) {
            toast.error(`${failed.length} Gaceta(s) fallaron: ${failed.map((s) => s.gacetaNumber).join(", ")}`);
          }
          router.refresh();
        })
        .catch((err: any) => {
          toast.error(err?.message ?? "Ocurrió un error procesando las Gacetas");
        });
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending || !hasPending}
      title={hasPending ? "Procesar Gacetas pendientes ahora" : "No hay Gacetas pendientes"}
      className="inline-flex items-center gap-2 border border-primary text-primary text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
      {isPending ? "Procesando..." : "Procesar ahora"}
    </button>
  );
}
