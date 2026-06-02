export interface ParsedArticle { articleNumber: number; articleLabel?: string; content: string; contentPlainText: string; }
export interface ParsedChapter { title: string; articles: ParsedArticle[]; }
export interface ParsedSection { title: string; chapters: ParsedChapter[]; }

type LineType = "libro" | "titulo" | "capitulo" | "seccion" | "articulo" | "content";

export function classifyLine(text: string): LineType {
  const t = text.trim();
  if (/^libro\s+/i.test(t)) return "libro";
  if (/^título\s+|^titulo\s+/i.test(t)) return "titulo";
  if (/^capítulo\s+|^capitulo\s+/i.test(t)) return "capitulo";
  if (/^sección\s+|^seccion\s+/i.test(t)) return "seccion";
  if (/^art[ií]culo\s+\d+[-]?[a-zA-Z]*/i.test(t)) return "articulo";
  return "content";
}

export function getArticleInfo(text: string): { articleNumber: number; articleLabel: string } {
  const match = text.match(/art[ií]culo\s+(\d+)(-[a-zA-Z]+)?/i);
  if (!match) return { articleNumber: 0, articleLabel: "" };
  const num = parseInt(match[1]);
  const suffix = match[2] ? match[2].toUpperCase() : "";
  const label = suffix ? `${num}${suffix}` : String(num);
  return { articleNumber: num, articleLabel: label };
}

export async function buildNumIdFormatMap(arrayBuffer: ArrayBuffer): Promise<Map<string, string>> {
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
  } catch {
    // ignore
  }
  return map;
}

export function formatToHtmlType(fmt: string): string {
  if (fmt === "lowerLetter") return "a";
  if (fmt === "upperLetter") return "A";
  if (fmt === "lowerRoman") return "i";
  if (fmt === "upperRoman") return "I";
  return "";
}

export async function convertDocxToHtml(arrayBuffer: ArrayBuffer, numIdFormatMap: Map<string, string>): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = await import("mammoth") as any;
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: ["p[style-name='List Paragraph'] => p.list-paragraph"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformDocument: (element: any) => element,
    }
  );
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
  } catch {
    // ignore
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(result.value, "text/html");
  // Solo aplicar tipo a listas de nivel raíz
  const topLevelLists = Array.from(doc.body.children).filter(
    (el) => el.tagName.toLowerCase() === "ol" || el.tagName.toLowerCase() === "ul"
  );
  let listIdx = 0;
  for (const ol of topLevelLists) {
    const numId = numIdsInOrder[listIdx];
    if (numId) {
      const fmt = numIdFormatMap.get(numId) || "decimal";
      const htmlType = formatToHtmlType(fmt);
      if (htmlType) ol.setAttribute("type", htmlType);
    }
    listIdx++;
  }
  return doc.body.innerHTML;
}

export function parseDocument(htmlContent: string): ParsedSection[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  // Solo elementos raíz, no querySelectorAll que penetra dentro de listas anidadas
  const blocks = Array.from(doc.body.children);

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
      if (tagName === "ol" || tagName === "ul" || tagName === "table") {
        currentContentHtml.push(el.outerHTML);
        currentContentPlain.push(text);
      } else if (text) {
        currentContentHtml.push(`<p>${el.innerHTML}</p>`);
        currentContentPlain.push(text);
      }
    }
  }

  flushArticle();
  return sections;
}
