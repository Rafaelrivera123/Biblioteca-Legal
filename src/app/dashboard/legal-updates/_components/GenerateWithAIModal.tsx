"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function GenerateWithAIModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function reset() {
    setFile(null);
    setResult(null);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/dashboard/generate-legal-updates", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al procesar la gaceta");
      }

      const data = await res.json();
      setResult({ created: data.created });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 border border-primary text-primary text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors">
          <Sparkles className="w-4 h-4" />
          Generar con IA
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Generar actualizaciones con IA</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="font-semibold text-lg">
              {result.created} borrador{result.created !== 1 ? "es" : ""} creado{result.created !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              Revísalos en la sección de Borradores antes de publicar.
            </p>
            <button onClick={() => setOpen(false)} className="mt-2 text-sm text-primary hover:underline">
              Cerrar
            </button>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            <p className="text-sm text-muted-foreground">
              Sube el PDF de una Gaceta Oficial y la IA identificará entre 5 y 10 actualizaciones legales y las guardará como borradores.
            </p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 transition-colors ${
                file
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 hover:border-gray-300 text-muted-foreground"
              }`}
            >
              <UploadCloud className="w-8 h-8" />
              {file ? (
                <span className="text-sm font-medium truncate max-w-[300px]">{file.name}</span>
              ) : (
                <span className="text-sm">Haz clic para seleccionar un PDF</span>
              )}
              <span className="text-xs text-muted-foreground">Solo archivos .pdf</span>
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Analizando gaceta...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Generar borradores</>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
