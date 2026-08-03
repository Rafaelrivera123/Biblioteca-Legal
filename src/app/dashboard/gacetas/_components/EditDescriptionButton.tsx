"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { updateGacetaDescription } from "../actions";

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
  const router = useRouter();

  const wordCount = countWords(value);
  const overLimit = wordCount > MAX_WORDS;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setValue(description ?? "");
  }

  function handleSave() {
    startTransition(() => {
      updateGacetaDescription(id, value)
        .then(() => {
          toast.success("Descripción actualizada.");
          setOpen(false);
          router.refresh();
        })
        .catch((err: any) => {
          toast.error(err?.message ?? "No se pudo guardar la descripción.");
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
            Se muestra en la tarjeta pública de /gacetas. Se genera sola al
            procesar la Gaceta, pero puedes corregirla aquí. Máximo {MAX_WORDS}{" "}
            palabras.
          </p>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            placeholder="Ej. Esta edición reforma el Código Tributario y crea un nuevo régimen para pequeños contribuyentes."
            disabled={isPending}
          />
          <p className={`text-xs ${overLimit ? "text-red-500" : "text-muted-foreground"}`}>
            {wordCount}/{MAX_WORDS} palabras
          </p>

          <button
            onClick={handleSave}
            disabled={isPending || overLimit}
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
