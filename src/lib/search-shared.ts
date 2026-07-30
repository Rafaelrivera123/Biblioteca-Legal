// Tipos y constantes compartidos entre /api/search (servidor) y el
// command palette de búsqueda global (cliente). No debe importar nada de
// Prisma ni de librerías server-only: este archivo se bundlea también en
// el cliente.

// Marcadores de texto plano (no HTML) que ts_headline inserta alrededor de
// la coincidencia dentro del fragmento devuelto por /api/search. Son
// strings elegidos por ser prácticamente imposibles de encontrar dentro de
// un texto legal real. El cliente los reemplaza por <mark> después de
// escapar el resto del snippet, así que no representan riesgo de
// inyección de HTML.
export const SEARCH_HL_START = "@@LEGALHL@@";
export const SEARCH_HL_END = "@@ENDLEGALHL@@";

export type SearchMode = "literal" | "semantic";

export type SearchDocumentResult = {
  id: string;
  name: string;
  slug: string | null;
  short_description: string;
  law_number: string;
};

export type SearchArticleResult = {
  id: string;
  articleNumber: number;
  articleLabel: string | null;
  snippet: string;
  documentId: string;
  documentName: string;
  documentSlug: string | null;
};

export type SearchResponse = {
  success: boolean;
  message?: string;
  query: string;
  mode: SearchMode;
  documents: SearchDocumentResult[];
  articles: SearchArticleResult[];
};

function escapeSnippetHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * El snippet que devuelve /api/search trae SEARCH_HL_START/SEARCH_HL_END
 * alrededor del término encontrado (ver ts_headline en la ruta). Acá se
 * escapa todo el texto primero (para que ningún caracter del artículo se
 * interprete como HTML) y solo después se reemplazan esos marcadores por
 * <mark>, así que no hay forma de inyectar HTML desde el contenido legal.
 * Usar con dangerouslySetInnerHTML.
 */
export function highlightSnippet(snippet: string): string {
  const escaped = escapeSnippetHtml(snippet);
  return escaped
    .split(SEARCH_HL_START)
    .join('<mark class="bg-[#D4AF37]/30 text-inherit rounded-sm px-0.5">')
    .split(SEARCH_HL_END)
    .join("</mark>");
}
