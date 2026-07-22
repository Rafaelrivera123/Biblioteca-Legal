"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import AlertModal from "@/components/ui/alert-modal";
import { deleteGaceta, retryGaceta } from "../actions";

export function GacetaRowActions({
  id,
  status,
}: {
  id: string;
  status: "pending" | "processing" | "processed" | "failed";
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  function handleRetry() {
    startTransition(() => {
      retryGaceta(id)
        .then(() => {
          toast.success("Gaceta puesta de nuevo en la cola.");
          router.refresh();
        })
        .catch((err: any) => {
          toast.error(err?.message ?? "No se pudo reintentar.");
        });
    });
  }

  function handleDelete() {
    startTransition(() => {
      deleteGaceta(id)
        .then(() => {
          toast.success("Gaceta eliminada.");
          setConfirmDelete(false);
          router.refresh();
        })
        .catch((err: any) => {
          toast.error(err?.message ?? "No se pudo eliminar.");
        });
    });
  }

  return (
    <div className="flex items-center gap-2">
      {status === "failed" && (
        <button
          onClick={handleRetry}
          disabled={isPending}
          title="Reintentar"
          className="text-muted-foreground hover:text-primary disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
        </button>
      )}
      {status !== "processing" && (
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={isPending}
          title="Eliminar"
          className="text-muted-foreground hover:text-red-500 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <AlertModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={isPending}
        title="¿Eliminar esta Gaceta?"
        message="Se borrará de la biblioteca y no se procesará. Las actualizaciones que ya se hayan generado a partir de ella no se tocan."
      />
    </div>
  );
}
