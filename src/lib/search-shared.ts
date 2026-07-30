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
