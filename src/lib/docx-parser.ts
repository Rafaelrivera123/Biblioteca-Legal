export interface ParsedArticle {
  articleNumber: number;
  articleLabel?: string;
  content: string;
  contentPlainText: string;
}
export interface ParsedChapter {
  title: string;
  articles: ParsedArticle[];
}
export interface ParsedSection {
  title: string;
  chapters: ParsedChapter[];
}

type LineType =
  | "libro"
  | "titulo"
  | "capitulo"
  | "seccion"
  | "articulo"
  | "content";

// Convierte número romano a arábigo (soporta hasta 3999)
function romanToInt(s: string): number {
  const vals: Record<string, number> = {
    I: 1, V: 5, X: 10, L: 50,
    C: 100, D: 500, M: 1000,
  };
  let result = 0;
  const upper = s.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const cur = vals[upper[i]] ?? 0;
    const next = vals[upper[i + 1]] ?? 0;
    result += cur < next ? -cur : cur;
  }
  return result;
}

// Valida que un string sea un número romano válido
function isRoman(s: string): boolean {
  return /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i.test(s) && s.length > 0;
}

export function classifyLine(text: string): LineType {
  const t = text.trim();
  if (/^libro\s+/i.test(t)) return "libro";
  if (/^título\s+|^titulo\s+/i.test(t)) return "titulo";
  if (/^capítulo\s+|^capitulo\s+/i.test(t)) return "capitulo";
  if (/^sección\s+|^seccion\s+/i.test(t)) return "seccion";

  // Artículo con número arábigo: "Artículo 1", "Artículo 1-A", "Artículo 1. Título"
  if (/^art[ií]culo\s+\d+[-]?[a-zA-Z]*/i.test(t)) return "articulo";

  // Artículo con número romano: "Artículo I", "Artículo IV", "Artículo XI"
  const romanMatch = t.match(/^art[ií]culo\s+([IVXLCDM]+)\b/i);
  if (romanMatch && isRoman(romanMatch[1])) return "articulo";

  // Convención de Viena: líneas que empiezan con número + punto + texto (sin ser sublistas)
  // Ej: "1. Alcance de la presente convención", "6. Capacidad de los estados"
  // Solo si es un número seguido de punto y espacio y texto largo (no sublistas como "a) ..." o "1.1.")
  if (/^\d+\.\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]/.test(t)) return "articulo";

  return "content";
}

export function getArticleInfo(text: string): {
  articleNumber: number;
  articleLabel: string;
} {
  const t = text.trim();

  // Artículo con número arábigo: "Artículo 15" o "Artículo 15-A" o "Artículo 15. Título"
  const arabicMatch = t.match(/^art[ií]culo\s+(\d+)(-[a-zA-Z]+)?/i);
  if (arabicMatch) {
    const num = parseInt(arabicMatch[1]);
    const suffix = arabicMatch[2] ? arabicMatch[2].toUpperCase() : "";
    const label = suffix ? `${num}${suffix}` : String(num);
    return { articleNumber: num, articleLabel: label };
  }

  // Artículo con número romano: "Artículo IV"
  const romanMatch = t.match(/^art[ií]culo\s+([IVXLCDM]+)\b/i);
  if (romanMatch && isRoman(romanMatch[1])) {
    const num = romanToInt(romanMatch[1]);
    const label = romanMatch[1].toUpperCase();
    return { articleNumber: num, articleLabel: label };
  }

  // Convención de Viena: "6. Capacidad de los estados para celebrar tratados"
  const viennaMatch = t.match(/^(\d+)\.\s+/);
  if (viennaMatch) {
    const num = parseInt(viennaMatch[1]);
    return { articleNumber: num, articleLabel: String(num) };
  }

  return { articleNumber: 0, articleLabel: "" };
}

// Ahora guarda TODOS los niveles: "numId-ilvl" -> fmt
export async function buildNumIdFormatMap(
  arrayBuffer: ArrayBuffer
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const numberingFile = zip.file("word/numbering.xml");
    if (!numberingFile) return map;
    const xml = await numberingFile.async("string");
    const xmlDoc = new DOMParser().parseFromString(xml, "application/xml");

    // abstractNumId -> { ilvl -> fmt }
    const abstractFormatMap = new Map<string, Map<string, string>>();
    xmlDoc.querySelectorAll("abstractNum").forEach((abstractNum) => {
      const abId = abstractNum.getAttribute("w:abstractNumId") || "";
      const lvlMap = new Map<string, string>();
      abstractNum.querySelectorAll("lvl").forEach((lvl) => {
        const ilvl = lvl.getAttribute("w:ilvl") || "0";
        const numFmt = lvl.querySelector("numFmt");
        const fmt = numFmt?.getAttribute("w:val") || "decimal";
        lvlMap.set(ilvl, fmt);
      });
      abstractFormatMap.set(abId, lvlMap);
    });

    // numId -> abstractNumId, store as "numId-ilvl" -> fmt
    xmlDoc.querySelectorAll("num").forEach((num) => {
      const numId = num.getAttribute("w:numId") || "";
      const absRef = num.querySelector("abstractNumId");
      const abId = absRef?.getAttribute("w:val") || "";
      const lvlMap = abstractFormatMap.get(abId);
      if (lvlMap) {
        lvlMap.forEach((fmt, ilvl) => {
          map.set(`${numId}-${ilvl}`, fmt);
        });
      }
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

export async function convertDocxToHtml(
  arrayBuffer: ArrayBuffer,
  numIdFormatMap: Map<string, string>
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = (await import("mammoth")) as any;
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: ["p[style-name='List Paragraph'] => p.list-paragraph"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformDocument: (element: any) => element,
    }
  );

  // Construir lista ordenada de (numId, ilvl) por aparición en el documento
  const numIdIlvlInOrder: { numId: string; ilvl: string }[] = [];
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docFile = zip.file("word/document.xml");
    if (docFile) {
      const xml = await docFile.async("string");
      const xmlDoc = new DOMParser().parseFromString(xml, "application/xml");
      xmlDoc.querySelectorAll("p").forEach((para) => {
        const numIdEl = para.querySelector("numId");
        const ilvlEl = para.querySelector("ilvl");
        if (numIdEl) {
          const val = numIdEl.getAttribute("w:val");
          const ilvl = ilvlEl?.getAttribute("w:val") || "0";
          if (val && val !== "0") {
            const last = numIdIlvlInOrder[numIdIlvlInOrder.length - 1];
            if (!last || last.numId !== val || last.ilvl !== ilvl) {
              numIdIlvlInOrder.push({ numId: val, ilvl });
            }
          }
        }
      });
    }
  } catch {
    // ignore
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(result.value, "text/html");

  // Aplicar tipo a TODAS las listas (raíz y anidadas) en orden de aparición
  const allLists = Array.from(doc.querySelectorAll("ol, ul"));
  allLists.forEach((ol, idx) => {
    const entry = numIdIlvlInOrder[idx];
    if (entry) {
      const fmt =
        numIdFormatMap.get(`${entry.numId}-${entry.ilvl}`) || "decimal";
      const htmlType = formatToHtmlType(fmt);
      if (htmlType) ol.setAttribute("type", htmlType);
    }
  });

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
        if (!currentSection) {
          currentSection = { title: "General", chapters: [] };
          sections.push(currentSection);
        }
        const ch = { title: "General", articles: [] };
        currentSection!.chapters.push(ch);
        currentChapter = ch;
        return ch;
      })();
      targetChapter.articles.push({
        articleNumber,
        articleLabel:
          articleLabel !== String(articleNumber) ? articleLabel : undefined,
        content: currentContentHtml.join("") || "<p></p>",
        contentPlainText: currentContentPlain.join("\n").trim(),
      });
      currentContentHtml = [];
      currentContentPlain = [];
      articleNumber = 0;
      articleLabel = "";
    }
  }

  for (const el of blocks) {
    const tagName = el.tagName.toLowerCase();
    const text = el.textContent?.trim() || "";
    if (!text && tagName !== "ol" && tagName !== "ul" && tagName !== "table")
      continue;

    const lineType = classifyLine(text);

    if (!lawStarted) {
      if (
        ["libro", "titulo", "capitulo", "seccion", "articulo"].includes(
          lineType
        )
      )
        lawStarted = true;
      else continue;
    }

    if (lineType === "libro" || lineType === "titulo") {
      flushArticle();
      currentSection = { title: text, chapters: [] };
      sections.push(currentSection);
      currentChapter = null;
    } else if (lineType === "capitulo" || lineType === "seccion") {
      flushArticle();
      if (!currentSection) {
        currentSection = { title: "General", chapters: [] };
        sections.push(currentSection);
      }
      currentChapter = { title: text, articles: [] };
      currentSection.chapters.push(currentChapter);
    } else if (lineType === "articulo") {
      flushArticle();
      if (!currentSection) {
        currentSection = { title: "General", chapters: [] };
        sections.push(currentSection);
      }
      if (!currentChapter) {
        currentChapter = { title: "General", articles: [] };
        currentSection.chapters.push(currentChapter);
      }
      const info = getArticleInfo(text);
      articleNumber = info.articleNumber;
      articleLabel = info.articleLabel;
    } else if (articleNumber > 0) {
      if (
        tagName === "ol" ||
        tagName === "ul" ||
        tagName === "table"
      ) {
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
