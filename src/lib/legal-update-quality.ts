/**
 * Filtra actualizaciones de bajo valor editorial (avisos de marca,
 * licitaciones, nombramientos, etc.) para que no entren en el índice
 * público ni en el sitemap. AdSense y Google Search penalizan este tipo
 * de contenido "thin" / auto-generado a escala.
 */

export type LegalUpdateQualityInput = {
  title: string;
  summary: string;
  content?: string | null;
  type: "REFORM" | "NEW_LAW" | "REPEAL" | string;
  relatedDocumentId?: string | null;
  relatedDocument?: { name: string } | null;
};

const THIN_PATTERNS: RegExp[] = [
  /\bregistro de marca\b/i,
  /\bmarca de servicio\b/i,
  /\bsolicitud de registro\b/i,
  /\blicitaci[oó]n p[uú]blica\b/i,
  /\blicencia de distribuci[oó]n\b/i,
  /\bcertificaci[oó]n de licencia\b/i,
  /\bnombramiento(?:s)? interin/i,
  /\blicencias y nombramientos\b/i,
  /\bjuegos de azar\b/i,
  /\bcasino(?:s)? en l[ií]nea\b/i,
  /\bapuestas en l[ií]nea\b/i,
  /\bprograma(?:s)? de fidelizaci[oó]n\b/i,
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function matchesThinPattern(text: string): boolean {
  return THIN_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Devuelve true cuando el post tiene valor editorial suficiente para
 * aparecer en listados públicos, homepage y sitemap.
 */
export function isSubstantialLegalUpdate(
  post: LegalUpdateQualityInput
): boolean {
  const title = post.title?.trim() ?? "";
  const summary = post.summary?.trim() ?? "";
  const contentText = post.content ? stripHtml(post.content) : "";
  const haystack = `${title}\n${summary}`;

  if (matchesThinPattern(haystack)) {
    return false;
  }

  const hasRelatedDoc = !!(post.relatedDocumentId || post.relatedDocument);

  // Reformas y derogaciones ligadas a un documento de la biblioteca son
  // el contenido original más valioso.
  if ((post.type === "REFORM" || post.type === "REPEAL") && hasRelatedDoc) {
    return true;
  }

  if (post.type === "REFORM" || post.type === "REPEAL") {
    return summary.length >= 120 || contentText.length >= 400;
  }

  // NEW_LAW y otros: exigir sustancia real, no un aviso breve.
  if (hasRelatedDoc && (summary.length >= 100 || contentText.length >= 350)) {
    return true;
  }

  return summary.length >= 180 && contentText.length >= 500;
}

export function filterSubstantialLegalUpdates<T extends LegalUpdateQualityInput>(
  posts: T[]
): T[] {
  return posts.filter(isSubstantialLegalUpdate);
}
