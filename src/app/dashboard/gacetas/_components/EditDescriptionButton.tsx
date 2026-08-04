"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { generateGacetaDescriptionAI, updateGacetaDescription } from "../actions";

const MAX_WORDS = 40;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

export function EditDescriptionButton({
  id,
  number,
  description,
}: {
  id: string;
  number: string;
  description: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(description ?? "");
  const [isPending, startTransition] = useTransition();
  const [isGenerating, startGenerating] = useTransition();
  const router = useRouter();

  const wordCount = countWords(value);
  const overLimit = wordCount > MAX_WORDS;
  const busy = isPending || isGenerating;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setValue(description ?? "");
  }

  function handleSave() {
    startTransition(() => {
      updateGacetaDescription(id, value)
        .then((res) => {
          if (!res.ok) {
            toast.error(res.message);
            return;
          }
          toast.success("Descripción actualizada.");
          setOpen(false);
          router.refresh();
        })
        .catch((err: unknown) => {
          toast.error(err instanceof Error ? err.message : "No se pudo guardar la descripción.");
        });
    });
  }

  // Genera un borrador y lo pone en el textarea — no guarda solo.
  // Si ya hay actualizaciones legales, arma la oración sin gastar tokens;
  // si no, usa Haiku con un extracto corto del PDF.
  function handleGenerate() {
    startGenerating(() => {
      generateGacetaDescriptionAI(id)
        .then((res) => {
          if (!res.ok) {
            toast.error(res.message);
            return;
          }
          setValue(res.description);
          if (res.source === "updates") {
            toast.success(
              "Descripción armada desde las actualizaciones (sin costo de IA). Revísala y dale Guardar."
            );
          } else {
            toast.success("Descripción generada con IA. Revísala y dale Guardar.");
          }
        })
        .catch((err: unknown) => {
          toast.error(err instanceof Error ? err.message : "No se pudo generar la descripción con IA.");
        });
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <button
        onClick={() => handleOpenChange(true)}
        title="Editar descripción"
        className="text-muted-foreground hover:text-primary"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <DialogContent className="sm:max-w-[520px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Descripción de La Gaceta N° {number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          <p className="text-sm text-muted-foreground">
            Se muestra en la tarjeta pública de /gacetas. Máximo {MAX_WORDS}{" "}
            palabras. Si ya procesaste esta Gaceta, se arma sola desde las
            actualizaciones (sin gastar créditos). Si no, usa un extracto
            corto del PDF con IA.
          </p>

          <button
            onClick={handleGenerate}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 border text-sm font-medium px-4 py-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGenerating ? "Generando..." : "Generar con IA"}
          </button>

          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            placeholder="Ej. Esta edición reforma el Código Tributario y crea un nuevo régimen para pequeños contribuyentes."
            disabled={busy}
          />
          <p className={`text-xs ${overLimit ? "text-red-500" : "text-muted-foreground"}`}>
            {wordCount}/{MAX_WORDS} palabras
          </p>

          <button
            onClick={handleSave}
            disabled={busy || overLimit}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
