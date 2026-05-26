// src/app/(dashboard)/dashboard/documents/import/_components/document-importer.tsx
"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";

interface Article {
  articleNumber: number;
  content: string;
  contentPlainText: string;
}
interface Chapter {
  title: string;
  articles: Article[];
}
interface Section {
  title: string;
  chapters: Chapter[];
}
interface ParsedDocument {
  name: string;
  short_description: string;
  law_number: string;
  categoryIds: string[];
  sections: Section[];
}
interface Category {
  id: string;
  name: string;
}

type LineType = "libro" | "titulo" | "capitulo" | "seccion" | "articulo" | "content";

function classifyLine(text: string): LineType {
  const t = text.trim();
  if (/^libro\s+/i.test(t)) return "libro";
  if (/^título\s+|^titulo\s+/i.test(t)) return "titulo";
  if (/^capítulo\s+|^capitulo\s+/i.test(t)) return "capitulo";
  if (/^sección\s+|^seccion\s+/i.test(t)) return "seccion";
  if (/^artículo\s+\d+|^articulo\s+\d+/i.test(t)) return "articulo";
  return "content";
}

function getArticleNumber(text: string): number {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

function parseDocument(htmlContent: string): Section[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const blocks = Array.from(doc.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, ol, ul"));

  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentChapter: Chapter | null = null;
  let currentContentHtml: string[] = [];
  let currentContentPlain: string[] = [];
  let articleNumber = 0;
  let lawStarted = false;

  function flushArticle() {
    if (articleNumber > 0) {
      const targetChapter = currentChapter ?? (() => {
        if (!currentSection) {
          currentSection = { title: "General", chapters: [] };
          sections.push(currentSection);
        }
        const ch = { title: "General", articles: [] };
        currentSection!.chapters.push(ch);
        currentChapter = ch;
        return ch;
      })();
      const contentHtml = currentContentHtml.join("") || "<p></p>";
      const contentPlain = currentContentPlain.join("\n").trim();
      targetChapter.articles.push({ articleNumber, content: contentHtml, contentPlainText: contentPlain });
      currentContentHtml = [];
      currentContentPlain = [];
      articleNumber = 0;
    }
  }

  function ensureSection(title: string) {
    flushArticle();
    currentSection = { title, chapters: [] };
    sections.push(currentSection);
    currentChapter = null;
  }

  function ensureChapter(title: string) {
    flushArticle();
    if (!currentSection) { currentSection = { title: "General", chapters: [] }; sections.push(currentSection); }
    currentChapter = { title, articles: [] };
    currentSection!.chapters.push(currentChapter);
  }

  for (const el of blocks) {
    const tagName = el.tagName.toLowerCase();
    const text = el.textContent?.trim() || "";
    if (!text && tagName !== "ol" && tagName !== "ul") continue;
    const lineType = classifyLine(text);
    if (!lawStarted) {
      if (["libro", "titulo", "capitulo", "seccion", "articulo"].includes(lineType)) lawStarted = true;
      else continue;
    }
    if (lineType === "libro") { ensureSection(text); }
    else if (lineType === "titulo") { ensureSection(text); }
    else if (lineType === "capitulo" || lineType === "seccion") { ensureChapter(text); }
    else if (lineType === "articulo") {
      flushArticle();
      if (!currentSection) { currentSection = { title: "General", chapters: [] }; sections.push(currentSection); }
      if (!currentChapter) { currentChapter = { title: "General", articles: [] }; currentSection.chapters.push(currentChapter); }
      articleNumber = getArticleNumber(text);
    } else if (articleNumber > 0) {
      if (tagName === "ol") {
        const items = el.querySelectorAll("li");
        let olHtml = "<ol>"; let olPlain = ""; let idx = 1;
        items.forEach((li) => { olHtml += `<li>${li.innerHTML}</li>`; olPlain += `${idx}. ${li.textContent?.trim()}\n`; idx++; });
        olHtml += "</ol>";
        currentContentHtml.push(olHtml); currentContentPlain.push(olPlain);
      } else if (tagName === "ul") {
        const items = el.querySelectorAll("li");
        let ulHtml = "<ul>"; let ulPlain = "";
        items.forEach((li) => { ulHtml += `<li>${li.innerHTML}</li>`; ulPlain += `• ${li.textContent?.trim()}\n`; });
        ulHtml += "</ul>";
        currentContentHtml.push(ulHtml); currentContentPlain.push(ulPlain);
      } else if (text) {
        currentContentHtml.push(`<p>${el.innerHTML}</p>`);
        currentContentPlain.push(text);
      }
    }
  }
  flushArticle();
  return sections;
}

export default function DocumentImporter() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "preview" | "saving">("upload");
  const [parsed, setParsed] = useState<ParsedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
  });

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".docx")) { toast.error("Please upload a .docx file."); return; }
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mammoth = await import("mammoth") as any;
      const arrayBuffer = await file.arrayBuffer();
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      const sections = parseDocument(htmlResult.value);
      const name = file.name.replace(".docx", "").replace(/_/g, " ");
      setParsed({ name, short_description: "", law_number: "", categoryIds: [], sections });
      setStep("preview");
      toast.success(`Document processed: ${sections.length} sections found.`);
    } catch { toast.error("Error processing document. Please try again."); }
    finally { setIsLoading(false); }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleSave = async () => {
    if (!parsed) return;
    setStep("saving");
    try {
      const response = await fetch("/api/documents/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await response.json();
      if (!response.ok) { toast.error(data.error || "Error saving document."); setStep("preview"); return; }
      toast.success(`"${parsed.name}" saved! ${data.summary?.sections} sections, ${data.summary?.chapters} chapters, ${data.summary?.articles} articles.`);
      router.push("/dashboard/documents");
    } catch { toast.error("Error saving document."); setStep("preview"); }
  };

  const toggleCategory = (id: string) => {
    setParsed((p) => {
      if (!p) return p;
      const already = p.categoryIds.includes(id);
      return { ...p, categoryIds: already ? p.categoryIds.filter((c) => c !== id) : [...p.categoryIds, id] };
    });
  };

  const totalChapters = parsed?.sections.reduce((a, s) => a + s.chapters.length, 0) ?? 0;
  const totalArticles = parsed?.sections.reduce((a, s) => s.chapters.reduce((b, c) => b + c.articles.length, 0) + a, 0) ?? 0;

  if (step === "upload") {
    return (
      <div className="bg-white p-[30px] border border-black/20 rounded-[8px] space-y-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("fileInput")?.click()}
          className={`border-2 border-dashed rounded-[8px] p-16 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-black/20 hover:border-primary/50"}`}
        >
          <div className="text-5xl mb-4">📄</div>
          <p className="font-semibold text-[18px] text-primary mb-2">
            {isLoading ? "Processing document..." : "Upload your Word file (.docx)"}
          </p>
          <p className="text-gray-500 text-[14px]">Drag and drop here or click to select</p>
          <input id="fileInput" type="file" accept=".docx" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="bg-white p-[30px] border border-black/20 rounded-[8px] space-y-4">
        <h2 className="font-semibold text-[20px] text-primary">Document Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Document Name *</label>
            <Input value={parsed?.name ?? ""} onChange={(e) => setParsed((p) => p ? { ...p, name: e.target.value } : p)} placeholder="Law name" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Law Number / Decree</label>
            <Input value={parsed?.law_number ?? ""} onChange={(e) => setParsed((p) => p ? { ...p, law_number: e.target.value } : p)} placeholder="e.g. Decree 189-1959" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Short Description</label>
          <Textarea value={parsed?.short_description ?? ""} onChange={(e) => setParsed((p) => p ? { ...p, short_description: e.target.value } : p)} placeholder="Brief description of the law..." className="min-h-[80px] resize-none" />
        </div>

        {/* Category selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories?.map((cat) => {
              const selected = parsed?.categoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-colors ${selected ? "bg-primary text-white border-primary" : "bg-white text-gray-700 border-gray-300 hover:border-primary"}`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
          {parsed?.categoryIds && parsed.categoryIds.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">{parsed.categoryIds.length} categor{parsed.categoryIds.length === 1 ? "y" : "ies"} selected</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Sections", value: parsed?.sections.length ?? 0 }, { label: "Chapters", value: totalChapters }, { label: "Articles", value: totalArticles }].map((s) => (
          <div key={s.label} className="bg-white p-6 border border-black/20 rounded-[8px] text-center">
            <div className="text-[36px] font-semibold text-primary">{s.value}</div>
            <div className="text-gray-500 text-[14px]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Structure Preview */}
      <div className="bg-white p-[30px] border border-black/20 rounded-[8px] space-y-3">
        <h2 className="font-semibold text-[20px] text-primary">Structure Preview</h2>
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {parsed?.sections.map((section, si) => (
            <div key={si} className="border border-black/10 rounded-[6px] overflow-hidden">
              <div className="bg-primary/5 px-4 py-2 font-semibold text-primary text-[14px] flex justify-between">
                <span>{section.title}</span>
                <span className="text-gray-400 font-normal">{section.chapters.length} cap.</span>
              </div>
              {section.chapters.slice(0, 3).map((chapter, ci) => (
                <div key={ci} className="px-4 py-2 border-t border-black/5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-700">{chapter.title}</span>
                    <span className="text-gray-400">{chapter.articles.length} arts.</span>
                  </div>
                  {chapter.articles.slice(0, 1).map((article, ai) => (
                    <div key={ai} className="ml-4 mt-1 text-[12px] text-gray-500 truncate">
                      Art. {article.articleNumber} — {article.contentPlainText.slice(0, 80)}...
                    </div>
                  ))}
                </div>
              ))}
              {section.chapters.length > 3 && (
                <div className="px-4 py-1 text-[12px] text-gray-400">+{section.chapters.length - 3} more chapters...</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="text-primary hover:text-primary/80" onClick={() => { setParsed(null); setStep("upload"); }}>
          Upload Another
        </Button>
        <Button onClick={handleSave} disabled={step === "saving"} className="w-fit bg-primary text-white hover:bg-primary/90">
          {step === "saving" ? "Saving..." : "Save to Database"}
        </Button>
      </div>
    </div>
  );
}
