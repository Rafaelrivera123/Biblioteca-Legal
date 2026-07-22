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
import { Input } from "@/components/ui/input";
import { UploadCloud, Loader2, CheckCircle2, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { useEdgeStore } from "@/lib/edgestore";
import { createGacetas } from "../actions";

interface PendingFile {
  file: File;
  number: string;
}

/**
 * Intenta adivinar el número de Gaceta a partir del nombre del archivo
 * (ej. "gaceta-37169.pdf", "La Gaceta 37,169.pdf") buscando una secuencia de
 * 4 a 6 dígitos, con o sin coma como separador de miles. El admin puede
 * corregirlo a mano antes de subir si el archivo no sigue este patrón.
 */
function guessGacetaNumber(filename: string): string {
  const match = filename.match(/(\d{2,3})[,.]?(\d{3})/);
  if (!match) return "";
  return `${match[1]},${match[2]}`;
}

export function UploadGacetasModal() {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [result, setResult] = useState<{ created: number; skipped: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { edgestore } = useEdgeStore();

  function reset() {
    setFiles([]);
    setResult(null);
    setLoading(false);
    setLoadingMsg("");
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles = Array.from(fileList).map((file) => ({
      file,
      number: guessGacetaNumber(file.name),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function updateNumber(index: number, value: string) {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, number: value } : f))
    );
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (files.length === 0) return;
    if (files.some((f) => !f.number.trim())) {
      toast.error("Ponle el número de Gaceta a cada archivo antes de subir.");
      return;
    }

    setLoading(true);
    try {
      const uploaded: { number: string; url: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        setLoadingMsg(`Subiendo PDF ${i + 1} de ${files.length}...`);
        const res = await edgestore.publicFiles.upload({ file: files[i].file });
        uploaded.push({ number: files[i].number.trim(), url: res.url });
      }

      setLoadingMsg("Guardando en la biblioteca de Gacetas...");
      const summary = await createGacetas(uploaded);
      setResult(summary);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Ocurrió un error inesperado subiendo las Gacetas");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <UploadCloud className="w-4 h-4" />
          Subir Gacetas
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Subir Gacetas Oficiales</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="font-semibold text-lg">
              {result.created} Gaceta{result.created !== 1 ? "s" : ""} agregada{result.created !== 1 ? "s" : ""} a la cola
            </p>
            {result.skipped.length > 0 && (
              <p className="text-sm text-amber-600">
                Se omitieron {result.skipped.length} por número repetido: {result.skipped.join(", ")}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Se procesarán automáticamente en el próximo ciclo (o dale a &quot;Procesar ahora&quot;).
            </p>
            <button onClick={() => setOpen(false)} className="mt-2 text-sm text-primary hover:underline">
              Cerrar
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Sube uno o varios PDFs de La Gaceta. El sistema intenta adivinar el
              número desde el nombre del archivo — revísalo y corrígelo si hace falta.
            </p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud className="w-7 h-7" />
              <span className="text-sm">Haz clic para seleccionar uno o varios PDFs</span>
              <span className="text-xs">Solo archivos .pdf</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />

            {files.length > 0 && (
              <div className="max-h-[280px] overflow-auto space-y-2 border rounded-lg p-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1" title={f.file.name}>
                      {f.file.name}
                    </span>
                    <Input
                      value={f.number}
                      onChange={(e) => updateNumber(i, e.target.value)}
                      placeholder="N° Gaceta"
                      className="w-28 h-8 text-sm"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={loading}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={files.length === 0 || loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{loadingMsg}</>
              ) : (
                <><UploadCloud className="w-4 h-4" />Agregar {files.length > 0 ? `${files.length} ` : ""}a la cola</>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
