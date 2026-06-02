"use client";
import { deleteDocument } from "@/actions/document/delete";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateSlug } from "@/lib/slug";
import {
  buildNumIdFormatMap,
  convertDocxToHtml,
  parseDocument,
  ParsedSection,
} from "@/lib/docx-parser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Loader2, RefreshCw, Upload } from "lucide-react";
import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

interface Article {
  id: string;
  articleNumber: number;
  articleLabel: string | null;
  display: string;
  section: string;
  chapter: string;
}

interface Props {
  documentId: string;
  documentName: string;
  documentData: {
    name: string;
    slug: string | null;
    short_description: string;
    law_number: string;
  };
  open: boolean;
  onClose: () => void;
}

const ArticleReviewModal = ({ documentId, documentName, documentData, open, onClose }: Props) => {
  const [pending, startTransition] = useTransition();
  const [reimportStep, setReimportStep] = useState<"idle" | "uploading" | "preview" | "saving">("idle");
  const [parsedSections, setParsedSections] = useState<ParsedSection[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: Article[]; categoryIds: string[] }>({
    queryKey: ["articles-review", documentId],
    queryFn: () =>
      fetch(`/api/documents/${documentId}/articles`).then((res) => res.json()),
    enabled: open && !!documentId,
  });

  const articles = data?.data ?? [];
  const categoryIds = data?.categoryIds ?? [];

  const issues: string[] = [];
  for (let i = 1; i < articles.length; i++) {
    const prev = articles[i - 1];
    const curr = articles[i];
    if (curr.articleNumber - prev.articleNumber > 1) {
      const hasSuffixBridge = articles.some(
        (a) => a.articleNumber >= prev.articleNumber &&
               a.articleNumber <= curr.articleNumber &&
               a.articleLabel !== null
      );
      if (!hasSuffixBridge) {
        issues.push(`Salto detectado: después del artículo ${prev.display} viene el ${curr.display}`);
      }
    }
  }

  const grouped = articles.reduce((acc, article) => {
    const key = article.section;
    if (!acc[key]) acc[key] = [];
    acc[key].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".docx")) { toast.error("Solo se aceptan archivos .docx"); return; }
    setReimportStep("uploading");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const numIdFormatMap = await buildNumIdFormatMap(arrayBuffer);
      const fixedHtml = await convertDocxToHtml(arrayBuffer, numIdFormatMap);
      const sections = parseDocument(fixedHtml);
      setParsedSections(sections);
      setReimportStep("preview");
      const totalArticles = sections.reduce((a, s) => s.chapters.reduce((b, c) => b + c.articles.length, 0) + a, 0);
      toast.success(`Documento procesado: ${totalArticles} artículos encontrados`);
    } catch (e) {
      console.error(e);
      toast.error("Error procesando el documento");
      setReimportStep("idle");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleReimport = () => {
    if (!parsedSections) return;
    setReimportStep("saving");
    startTransition(async () => {
      const deleteRes = await deleteDocument(documentId);
      if (!deleteRes.success) {
        toast.error("Error eliminando el documento anterior");
        setReimportStep("preview");
        return;
      }
      try {
        const response = await fetch("/api/documents/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: documentData.name,
            slug: documentData.slug || generateSlug(documentData.name),
            short_description: documentData.short_description,
            law_number: documentData.law_number,
            published: true,
            sections: parsedSections,
            categoryIds, // categorías originales del documento
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          toast.error(result.error || "Error reimportando el documento");
          setReimportStep("preview");
          return;
        }
        toast.success(`Reimportado: ${result.summary?.articles} artículos guardados`);
        queryClient.invalidateQueries({ queryKey: ["documents-admin"] });
        setReimportStep("idle");
        setParsedSections(null);
        refetch();
        onClose();
      } catch {
        toast.error("Error reimportando el documento");
        setReimportStep("preview");
      }
    });
  };

  const totalParsedArticles = parsedSections?.reduce((a, s) => s.chapters.reduce((b, c) => b + c.articles.length, 0) + a, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setReimportStep("idle"); setParsedSections(null); onClose(); } }}>
      <DialogContent className="max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-[20px]">
            Revisión de artículos — {documentName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <div className="text-[28px] font-bold text-primary">{articles.length}</div>
              <div className="text-gray-500 text-[14px]">artículos en total</div>
              {issues.length === 0 ? (
                <div className="ml-auto flex items-center gap-2 text-green-600 text-[13px]">
                  <CheckCircle size={16} />
                  Sin problemas detectados
                </div>
              ) : (
                <div className="ml-auto flex items-center gap-2 text-red-500 text-[13px]">
                  <AlertTriangle size={16} />
                  {issues.length} problema(s) detectado(s)
                </div>
              )}
            </div>

            {issues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-red-600 text-[14px] flex items-center gap-2">
                  <AlertTriangle size={16} /> Posibles artículos faltantes
                </p>
                {issues.map((issue, i) => (
                  <p key={i} className="text-[13px] text-red-500">{issue}</p>
                ))}
              </div>
            )}

            {reimportStep === "idle" && Object.entries(grouped).map(([section, sectionArticles]) => (
              <div key={section}>
                <p className="font-semibold text-primary text-[14px] mb-2 border-b pb-1">{section}</p>
                <div className="flex flex-wrap gap-2">
                  {sectionArticles.map((article) => (
                    <span
                      key={article.id}
                      className={`px-2 py-1 rounded text-[12px] font-medium border ${
                        article.articleLabel
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      Art. {article.display}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {reimportStep === "idle" && (
              <div className="border-t pt-4">
                <p className="text-[13px] text-gray-500 mb-3">¿Necesitas corregir este documento? Sube el archivo Word actualizado para reimportarlo con los mismos metadatos.</p>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-black/20 hover:border-primary/50"}`}
                >
                  <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                  <p className="text-[13px] text-gray-500">Arrastra el .docx aquí o haz clic para seleccionar</p>
                  <input ref={fileInputRef} type="file" accept=".docx" className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }} />
                </div>
              </div>
            )}

            {reimportStep === "uploading" && (
              <div className="flex items-center justify-center py-6 gap-3 text-primary">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-[14px]">Procesando documento...</span>
              </div>
            )}

            {reimportStep === "preview" && parsedSections && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary text-[15px]">Documento procesado</p>
                    <p className="text-[13px] text-gray-500">{parsedSections.length} secciones, {totalParsedArticles} artículos encontrados</p>
                  </div>
                  <Button variant="outline" className="text-primary hover:text-primary/80 text-[13px]" onClick={() => { setReimportStep("idle"); setParsedSections(null); }}>
                    Cancelar
                  </Button>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-[13px] text-yellow-700 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    Esto eliminará el documento actual y lo reemplazará con el nuevo archivo. Los metadatos (nombre, descripción, ley) se mantendrán.
                  </p>
                </div>
                <Button className="w-full" onClick={handleReimport} disabled={pending}>
                  {pending ? (
                    <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Reimportando...</span>
                  ) : (
                    <span className="flex items-center gap-2"><RefreshCw size={16} /> Confirmar reimportación</span>
                  )}
                </Button>
              </div>
            )}

            {reimportStep !== "preview" && reimportStep !== "uploading" && (
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={onClose} className="text-primary hover:text-primary/80">
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ArticleReviewModal;
