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

interface ParsedArticle { articleNumber: number; articleLabel?: string; content: string; contentPlainText: string; }
interface ParsedChapter { title: string; articles: ParsedArticle[]; }
interface ParsedSection { title: string; chapters: ParsedChapter[]; }

function classifyLine(text: string) {
  const t = text.trim();
  if (/^libro\s+/i.test(t)) return "libro";
  if (/^título\s+|^titulo\s+/i.test(t)) return "titulo";
  if (/^capítulo\s+|^capitulo\s+/i.test(t)) return "capitulo";
  if (/^sección\s+|^seccion\s+/i.test(t)) return "seccion";
  if (/^art[ií]culo\s+\d+[-]?[a-zA-Z]*/i.test(t)) return "articulo";
  return "content";
}

function getArticleInfo(text: string): { articleNumber: number; articleLabel: string } {
  const match = text.match(/art[ií]culo\s+(\d+)(-[a-zA-Z]+)?/i);
  if (!match) return { articleNumber: 0, articleLabel: "" };
  const num = parseInt(match[1]);
  const suffix = match[2] ? match[2].toUpperCase() : "";
  const label = suffix ? `${num}${suffix}` : String(num);
  return { articleNumber: num, articleLabel: label };
}

async function buildNumIdFormatMap(arrayBuffer: ArrayBuffer): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const numberingFile = zip.file("word/numbering.xml");
    if (!numberingFile) return map;
    const xml = await numberingFile.async("string");
    const xmlDoc = new DOMParser().parseFromString(xml, "application/xml");
    const abstractFormatMap = new Map<string, string>();
    xmlDoc.querySelectorAll("abstractNum").forEach((abstractNum) => {
      const abId = abstractNum.getAttribute("w:abstractNumId") || "";
      abstractNum.querySelectorAll("lvl").forEach((lvl) => {
        if (lvl.getAttribute("w:ilvl") === "0") {
          const numFmt = lvl.querySelector("numFmt");
          const fmt = numFmt?.getAttribute("w:val") || "decimal";
          abstractFormatMap.set(abId, fmt);
        }
      });
    });
    xmlDoc.querySelectorAll("num").forEach((num) => {
      const numId = num.getAttribute("w:numId") || "";
      const absRef = num.querySelector("abstractNumId");
      const abId = absRef?.getAttribute("w:val") || "";
      const fmt = abstractFormatMap.get(abId) || "decimal";
      map.set(numId, fmt);
    });
  } catch { /* ignore */ }
  return map;
}

function formatToHtmlType(fmt: string): string {
  if (fmt === "lowerLetter") return "a";
  if (fmt === "upperLetter") return "A";
  if (fmt === "lowerRoman") return "i";
  if (fmt === "upperRoman") return "I";
  return "";
}

async function convertDocxToHtml(arrayBuffer: ArrayBuffer, numIdFormatMap: Map<string, string>): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = await import("mammoth") as any;
  const result = await mammoth.convertToHtml({ arrayBuffer }, {
    styleMap: ["p[style-name='List Paragraph'] => p.list-paragraph"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformDocument: (element: any) => element,
  });
  const numIdsInOrder: string[] = [];
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docFile = zip.file("word/document.xml");
    if (docFile) {
      const xml = await docFile.async("string");
      const xmlDoc = new DOMParser().parseFromString(xml, "application/xml");
      xmlDoc.querySelectorAll("p").forEach((para) => {
        const numId = para.querySelector("numId");
        if (numId) {
          const val = numId.getAttribute("w:val");
          if (val && val !== "0") {
            if (numIdsInOrder.length === 0 || numIdsInOrder[numIdsInOrder.length - 1] !== val)
              numIdsInOrder.push(val);
          }
        }
      });
    }
  } catch { /* ignore */ }
  const parser = new DOMParser();
  const doc = parser.parseFromString(result.value, "text/html");
  doc.querySelectorAll("ol").forEach((ol, idx) => {
    const numId = numIdsInOrder[idx];
    if (numId) {
      const fmt = numIdFormatMap.get(numId) || "decimal";
      const htmlType = formatToHtmlType(fmt);
      if (htmlType) ol.setAttribute("type", htmlType);
    }
  });
  return doc.body.innerHTML;
}

function parseDocument(htmlContent: string): ParsedSection[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const blocks = Array.from(doc.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, ol, ul, table"));
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let currentChapter: ParsedChapter | null = null;
  let currentContentHtml: string[] = [];
  let currentContentPlain: string[] = [];
  let articleNumber = 0;
  let articleLabel = "";
  let lawStarted = false;

  function flushArticle() {
    if (articleNumber > 0) {
      const targetChapter = currentChapter ?? (() => {
        if (!currentSection) { currentSection = { title: "General", chapters: [] }; sections.push(currentSection); }
        const ch = { title: "General", articles: [] };
        currentSection!.chapters.push(ch);
        currentChapter = ch;
        return ch;
      })();
      targetChapter.articles.push({
        articleNumber,
        articleLabel: articleLabel !== String(articleNumber) ? articleLabel : undefined,
        content: currentContentHtml.join("") || "<p></p>",
        contentPlainText: currentContentPlain.join("\n").trim(),
      });
      currentContentHtml = []; currentContentPlain = []; articleNumber = 0; articleLabel = "";
    }
  }

  for (const el of blocks) {
    const tagName = el.tagName.toLowerCase();
    const text = el.textContent?.trim() || "";
    if (!text && tagName !== "ol" && tagName !== "ul" && tagName !== "table") continue;
    const lineType = classifyLine(text);
    if (!lawStarted) {
      if (["libro", "titulo", "capitulo", "seccion", "articulo"].includes(lineType)) lawStarted = true;
      else continue;
    }
    if (lineType === "libro" || lineType === "titulo") {
      flushArticle();
      currentSection = { title: text, chapters: [] };
      sections.push(currentSection);
      currentChapter = null;
    } else if (lineType === "capitulo" || lineType === "seccion") {
      flushArticle();
      if (!currentSection) { currentSection = { title: "General", chapters: [] }; sections.push(currentSection); }
      currentChapter = { title: text, articles: [] };
      currentSection.chapters.push(currentChapter);
    } else if (lineType === "articulo") {
      flushArticle();
      if (!currentSection) { currentSection = { title: "General", chapters: [] }; sections.push(currentSection); }
      if (!currentChapter) { currentChapter = { title: "General", articles: [] }; currentSection.chapters.push(currentChapter); }
      const info = getArticleInfo(text);
      articleNumber = info.articleNumber;
      articleLabel = info.articleLabel;
    } else if (articleNumber > 0) {
      if (tagName === "ol") {
        const items = el.querySelectorAll("li");
        const olType = el.getAttribute("type") || "";
        const olTypeAttr = olType ? ` type="${olType}"` : "";
        let olHtml = `<ol${olTypeAttr}>`; let olPlain = ""; let idx = 1;
        items.forEach((li) => { olHtml += `<li>${li.innerHTML}</li>`; olPlain += `${idx}. ${li.textContent?.trim()}\n`; idx++; });
        olHtml += "</ol>";
        currentContentHtml.push(olHtml); currentContentPlain.push(olPlain);
      } else if (tagName === "ul") {
        const items = el.querySelectorAll("li");
        let ulHtml = "<ul>"; let ulPlain = "";
        items.forEach((li) => { ulHtml += `<li>${li.innerHTML}</li>`; ulPlain += `• ${li.textContent?.trim()}\n`; });
        ulHtml += "</ul>";
        currentContentHtml.push(ulHtml); currentContentPlain.push(ulPlain);
      } else if (tagName === "table") {
        currentContentHtml.push(el.outerHTML);
        currentContentPlain.push(el.textContent?.trim() || "");
      } else if (text) {
        currentContentHtml.push(`<p>${el.innerHTML}</p>`);
        currentContentPlain.push(text);
      }
    }
  }
  flushArticle();
  return sections;
}

const ArticleReviewModal = ({ documentId, documentName, documentData, open, onClose }: Props) => {
  const [pending, startTransition] = useTransition();
  const [reimportStep, setReimportStep] = useState<"idle" | "uploading" | "preview" | "saving">("idle");
  const [parsedSections, setParsedSections] = useState<ParsedSection[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: Article[] }>({
    queryKey: ["articles-review", documentId],
    queryFn: () =>
      fetch(`/api/documents/${documentId}/articles`).then((res) => res.json()),
    enabled: open && !!documentId,
  });

  const articles = data?.data ?? [];
  const issues: string[] = [];
  const numbers = articles.map((a) => a.articleNumber);
  for (let i = 1; i < numbers.length; i++) {
    const prev = numbers[i - 1];
    const curr = numbers[i];
    if (curr - prev > 1) {
      issues.push(`Salto detectado: después del artículo ${prev} viene el ${curr}`);
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
      // 1. Borrar documento actual
      const deleteRes = await deleteDocument(documentId);
      if (!deleteRes.success) {
        toast.error("Error eliminando el documento anterior");
        setReimportStep("preview");
        return;
      }
      // 2. Reimportar con los mismos metadatos
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
            categoryIds: [],
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
            {/* Resumen */}
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

            {/* Problemas */}
            {issues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-red-600 text-[14px] flex items-center gap-2">
                  <AlertTriangle size={16} /> Posibles artículos faltantes
                </p>
                {issues.map((issue, i) => (
                  <p key={i} className="text-[13px] text-red-500">{issue}</p>
                ))}
                <p className="text-[12px] text-red-400 mt-2">
                  Si hay artículos con sufijo (ej: 29-A, 29-B) pueden causar saltos. Verifica abajo si están correctamente etiquetados.
                </p>
              </div>
            )}

            {/* Lista por sección */}
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

            {/* Zona de reimportación */}
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
                <Button
                  className="w-full"
                  onClick={handleReimport}
                  disabled={pending}
                >
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
