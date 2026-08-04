/**
 * Helpers compartidos para generar metadata (title, description, Open Graph)
 * dentro de los límites recomendados por buscadores (Google/Ahrefs).
 *
 * Límites usados:
 * - Title: 60 caracteres (Google trunca ~60-65 en desktop)
 * - Meta description: 155 caracteres (Google trunca ~155-160)
 *
 * El layout raíz aplica `title.template = "%s | Biblioteca Legal HN"`.
 * Por eso `buildSeoTitle` NO debe incluir el sufijo de marca: solo el
 * contenido, ya truncado para que el título final quepa en el límite.
 */

export const SITE_NAME = "Biblioteca Legal HN";
export const SITE_URL = "https://www.bibliotecalegalhn.com";
export const SITE_OG_IMAGE = "/site/opengraph-image.webp";

export const TITLE_MAX_LENGTH = 60;
export const DESCRIPTION_MAX_LENGTH = 155;

const TITLE_SUFFIX = ` | ${SITE_NAME}`;

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
 * Arma el segmento de title que el template del layout convertirá en
 * "{contenido} | Biblioteca Legal HN", garantizando que el resultado final
 * no exceda TITLE_MAX_LENGTH.
 */
export function buildSeoTitle(
  content: string,
  maxLength: number = TITLE_MAX_LENGTH
): string {
  const clean = content.trim();
  const contentBudget = maxLength - TITLE_SUFFIX.length;

  if (contentBudget <= 15) {
    return truncateForSeo(clean, maxLength);
  }
  if (clean.length <= contentBudget) return clean;
  return truncateForSeo(clean, contentBudget);
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
