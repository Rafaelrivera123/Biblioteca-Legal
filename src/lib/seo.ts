/**
 * Helpers compartidos para generar metadata (title, description, Open Graph)
 * dentro de los límites recomendados por buscadores (Google/Ahrefs).
 *
 * Límites usados:
 * - Title: 60 caracteres (Google trunca ~60-65 en desktop)
 * - Meta description: 155 caracteres (Google trunca ~155-160)
 */

export const SITE_NAME = "Biblioteca Legal HN";

export const SITE_OG_IMAGE =
  "https://files.edgestore.dev/ln9m9j3kr2yibrue/staticFiled/_public/opengraph-image.webp";

export const TITLE_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 155;

/**
 * Trunca un texto a maxLength caracteres, cortando en el último espacio
 * disponible para no partir una palabra a la mitad, y agrega "…".
 */
export function truncateForSeo(text: string, maxLength: number): string {
  const clean = text.trim();
  if (clean.length <= maxLength) return clean;

  const sliced = clean.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const safe = lastSpace > maxLength * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return `${safe.trimEnd()}…`;
}

/**
 * Arma un title "{contenido} | Biblioteca Legal HN" garantizando que el
 * resultado final no exceda TITLE_MAX_LENGTH. Si no alcanza el espacio,
 * se prioriza el contenido y se quita el sufijo antes que truncar feo.
 */
export function buildSeoTitle(
  content: string,
  maxLength: number = TITLE_MAX_LENGTH
): string {
  const suffix = ` | ${SITE_NAME}`;
  const full = `${content.trim()}${suffix}`;
  if (full.length <= maxLength) return full;

  // Si el contenido solo (sin sufijo) ya es muy largo, lo truncamos y
  // le devolvemos el sufijo si cabe; si no, se queda sin sufijo.
  const withoutSuffixBudget = maxLength - suffix.length;
  if (withoutSuffixBudget > 15) {
    return `${truncateForSeo(content, withoutSuffixBudget)}${suffix}`;
  }
  return truncateForSeo(content, maxLength);
}

/**
 * Arma una meta description respetando DESCRIPTION_MAX_LENGTH. Si al
 * agregar un sufijo (ej. CTA) se pasa del límite, prioriza el contenido
 * base y descarta el sufijo.
 */
export function buildSeoDescription(
  base: string,
  suffix = "",
  maxLength: number = DESCRIPTION_MAX_LENGTH
): string {
  const cleanBase = base.trim();
  const withSuffix = suffix ? `${cleanBase} ${suffix.trim()}` : cleanBase;

  if (withSuffix.length <= maxLength) return withSuffix;
  if (cleanBase.length <= maxLength) return cleanBase;
  return truncateForSeo(cleanBase, maxLength);
}
