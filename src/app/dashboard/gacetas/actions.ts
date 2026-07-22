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
import { UploadCloud, Loader2, CheckCircle2, X, FileText, AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { createGacetaFromFile } from "../actions";

type FileStatus = "idle" | "uploading" | "done" | "error";

interface PendingFile {
  file: File;
  number: string;
  status: FileStatus;
  message?: string;
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

// Con lotes grandes (100+ Gacetas) un solo blip de red no debe tumbar la
// subida entera: cada archivo se reintenta hasta 3 veces antes de marcarse
// como fallido de verdad.
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function UploadGacetasModal() {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function reset() {
    setFiles([]);
    setLoading(false);
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles: PendingFile[] = Array.from(fileList).map((file) => ({
      file,
      number: guessGacetaNumber(file.name),
      status: "idle",
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

  function setFileState(index: number, patch: Partial<PendingFile>) {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  // Sube un archivo con reintentos automáticos. Un fallo "de negocio" (ej.
  // número duplicado) no se reintenta, se marca de una vez. Un fallo por
  // excepción (red, timeout) sí se reintenta hasta MAX_ATTEMPTS veces.
  async function uploadWithRetry(index: number, file: PendingFile) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const formData = new FormData();
        formData.set("number", file.number.trim());
        formData.set("file", file.file);
        const res = await createGacetaFromFile(formData);
        if (res.ok) {
          setFileState(index, { status: "done", message: res.message });
        } else {
          setFileState(index, { status: "error", message: res.message });
        }
        return;
      } catch (err: any) {
        if (attempt < MAX_ATTEMPTS) {
          setFileState(index, {
            status: "uploading",
            message: `Reintentando (${attempt}/${MAX_ATTEMPTS})...`,
          });
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        setFileState(index, {
          status: "error",
          message: err?.message ?? "Error de red al subir el archivo.",
        });
      }
    }
  }

  // Sube todo lo que no esté ya "done", una Gaceta a la vez. Nunca se
  // detiene por completo: si una falla (número duplicado, PDF corrupto,
  // o se agotan los reintentos por red) simplemente sigue con la
  // siguiente, para que un lote de 100+ nunca se caiga entero por un
  // solo archivo problemático.
  async function handleSubmit() {
    const pending = files
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => f.status !== "done");

    if (pending.length === 0) return;
    if (pending.some(({ f }) => !f.number.trim())) {
      toast.error("Ponle el número de Gaceta a cada archivo antes de subir.");
      return;
    }

    setLoading(true);
    try {
      for (const { f, i } of pending) {
        setFileState(i, { status: "uploading", message: undefined });
        await uploadWithRetry(i, f);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const finished =
    !loading && files.length > 0 && files.every((f) => f.status === "done" || f.status === "error");

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

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Sube uno o varios PDFs de La Gaceta. El sistema intenta adivinar el
            número desde el nombre del archivo — revísalo y corrígelo si hace falta.
            Se suben de a uno en una cola: si alguno falla, los demás siguen sin problema.
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
            <>
              {(loading || finished) && (
                <p className="text-sm font-medium">
                  {doneCount} de {files.length} subidas
                  {errorCount > 0 ? ` — ${errorCount} con error` : ""}
                </p>
              )}
              <div className="max-h-[320px] overflow-auto space-y-2 border rounded-lg p-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {f.status === "uploading" && <Loader2 className="w-4 h-4 shrink-0 animate-spin text-blue-500" />}
                    {f.status === "done" && <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />}
                    {f.status === "error" && <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />}
                    {f.status === "idle" && <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block" title={f.file.name}>
                        {f.file.name}
                      </span>
                      {f.message && (
                        <span className={`text-xs block truncate ${f.status === "error" ? "text-red-500" : "text-muted-foreground"}`}>
                          {f.message}
                        </span>
                      )}
                    </div>
                    <Input
                      value={f.number}
                      onChange={(e) => updateNumber(i, e.target.value)}
                      placeholder="N° Gaceta"
                      className="w-28 h-8 text-sm shrink-0"
                      disabled={loading || f.status === "done"}
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={loading}
                      className="text-muted-foreground hover:text-red-500 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-2">
            {finished && errorCount > 0 && (
              <button
                onClick={handleSubmit}
                className="flex-1 inline-flex items-center justify-center gap-2 border text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reintentar {errorCount} fallida{errorCount !== 1 ? "s" : ""}
              </button>
            )}
            <button
              onClick={finished ? () => setOpen(false) : handleSubmit}
              disabled={files.length === 0 || loading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Subiendo...</>
              ) : finished ? (
                <><CheckCircle2 className="w-4 h-4" />Cerrar</>
              ) : (
                <><UploadCloud className="w-4 h-4" />Agregar {files.length > 0 ? `${files.length} ` : ""}a la cola</>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
