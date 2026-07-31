/**
 * Genera preguntas frecuentes (FAQ) para la página de detalle de una ley o
 * código, a partir de los datos que ya existen en el documento y, si
 * existe, la actualización legal más reciente relacionada con él.
 *
 * Objetivo: capturar featured snippets de Google para búsquedas tipo
 * "qué es el código X", "dónde consultar el código X actualizado", "última
 * reforma al código X", sin inventar hechos legales que no estén
 * respaldados por nuestros propios datos (decreto, descripción, última
 * reforma registrada en la plataforma).
 *
 * Se aplica a cualquier documento (no solo a 3 leyes puntuales) porque el
 * costo de mantenimiento es cero: todo sale de datos que ya existen en
 * Prisma, no hay texto hardcodeado por ley.
 */

export interface LawFaqLink {
  href: string;
  label: string;
}

export interface LawFaqItem {
  question: string;
  answer: string;
  link?: LawFaqLink;
}

interface FaqDocument {
  name: string;
  short_description?: string | null;
  law_number?: string | null;
}

interface FaqLatestUpdate {
  title: string;
  slug: string;
  publishedAt: Date | null;
}

function isFeminine(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return (
    lower.startsWith("ley") ||
    lower.startsWith("constitución") ||
    lower.startsWith("constitucion")
  );
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getDocumentFaqs(
  document: FaqDocument,
  nameWithHonduras: string,
  latestUpdate?: FaqLatestUpdate | null
): LawFaqItem[] {
  const name = document.name.trim();
  const feminine = isFeminine(name);
  const el = feminine ? "la" : "el";
  const del = feminine ? "de la" : "del";
  const este = feminine ? "esta" : "este";

  const faqs: LawFaqItem[] = [];

  faqs.push({
    question: `¿Qué es ${el} ${nameWithHonduras}?`,
    answer:
      document.short_description?.trim() ||
      `${capitalize(el)} ${nameWithHonduras} es uno de los cuerpos legales vigentes de Honduras, disponible con su texto completo y actualizado en Biblioteca Legal HN.`,
  });

  if (document.law_number?.trim()) {
    faqs.push({
      question: `¿Cuál es el número de decreto ${del} ${name}?`,
      answer: `${capitalize(el)} ${name} corresponde al ${document.law_number.trim()}, según el Diario Oficial La Gaceta de la República de Honduras.`,
    });
  }

  faqs.push({
    question: `¿Dónde puedo consultar el texto completo y actualizado ${del} ${name}?`,
    answer: `En Biblioteca Legal HN puedes consultar gratis el texto íntegro y vigente ${del} ${name}, artículo por artículo, con un buscador para localizar disposiciones por palabra, número de artículo o en lenguaje natural.`,
  });

  faqs.push({
    question: `¿Cada cuánto se actualiza ${este} documento?`,
    answer: `Revisamos La Gaceta, el diario oficial de Honduras, varias veces por semana. Cuando se publica un decreto que reforma, deroga o crea disposiciones ${del} ${name}, actualizamos el texto vigente en la plataforma y publicamos un resumen en lenguaje claro en Actualizaciones Legales.`,
  });

  if (latestUpdate) {
    const dateText = latestUpdate.publishedAt
      ? ` (${formatDate(latestUpdate.publishedAt)})`
      : "";
    faqs.push({
      question: `¿Cuál fue la última reforma ${del} ${name}?`,
      answer: `La actualización más reciente registrada en la plataforma es "${latestUpdate.title}"${dateText}.`,
      link: {
        href: `/actualizaciones/${latestUpdate.slug}`,
        label: "Ver el análisis completo →",
      },
    });
  }

  return faqs;
}
