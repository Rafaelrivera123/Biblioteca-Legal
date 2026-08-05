import { getAllGuides, type GuideRelated } from "@/content/guias";

/**
 * Head SEO targets: the three queries we want to own in Google HN.
 * Collection pages for these slugs get boosted H1, intros, FAQs, and sitemap priority.
 */

export type HeadCodeFaq = {
  question: string;
  answer: string;
};

export type HeadCodeConfig = {
  slug: string;
  /** H1 / display title aligned with search intent */
  displayTitle: string;
  /** Short label for homepage chips */
  shortLabel: string;
  /** Unique intro shown above the article reader (SSR, crawlable) */
  seoIntro: string[];
  /** Sibling codes to cross-link */
  siblingSlugs: string[];
  /** Extra FAQs unique to this code (after the generic “qué es”) */
  extraFaqs: HeadCodeFaq[];
};

export const HEAD_CODE_SLUGS = [
  "codigo-penal-honduras",
  "codigo-civil-honduras",
  "constitucion-de-la-republica-de-honduras",
] as const;

export type HeadCodeSlug = (typeof HEAD_CODE_SLUGS)[number];

export const HEAD_CODES: Record<HeadCodeSlug, HeadCodeConfig> = {
  "codigo-penal-honduras": {
    slug: "codigo-penal-honduras",
    displayTitle: "Código Penal de Honduras",
    shortLabel: "Código Penal",
    siblingSlugs: [
      "codigo-procesal-penal-honduras",
      "constitucion-de-la-republica-de-honduras",
      "codigo-civil-honduras",
    ],
    seoIntro: [
      "Consulta gratis el texto completo y actualizado del Código Penal de Honduras, artículo por artículo. Esta es la norma que tipifica los delitos y las penas en el ordenamiento jurídico hondureño.",
      "Úsala para estudiar, preparar parciales o ubicar el tipo penal aplicable. Combínala con el Código Procesal Penal cuando necesites el procedimiento, y sigue las reformas publicadas en La Gaceta desde Actualizaciones Legales.",
    ],
    extraFaqs: [
      {
        question: "¿El Código Penal de Honduras tipifica todos los delitos?",
        answer:
          "El Código Penal es el cuerpo principal que tipifica delitos y penas en Honduras, pero pueden existir tipos penales o regímenes especiales en leyes especiales. Conviene leer el artículo del Código junto con cualquier ley especial aplicable al caso.",
      },
      {
        question: "¿Cómo busco un artículo del Código Penal vigente?",
        answer:
          "En esta página puedes saltar por número de artículo, buscar por palabra o frase, o usar el asistente legal para ubicar la disposición en lenguaje natural. El texto mostrado corresponde a la versión vigente publicada en la plataforma.",
      },
    ],
  },
  "codigo-civil-honduras": {
    slug: "codigo-civil-honduras",
    displayTitle: "Código Civil de Honduras",
    shortLabel: "Código Civil",
    siblingSlugs: [
      "codigo-de-familia-honduras",
      "codigo-de-comercio-honduras",
      "constitucion-de-la-republica-de-honduras",
      "codigo-penal-honduras",
    ],
    seoIntro: [
      "Lee gratis el Código Civil de Honduras completo y actualizado. Regula personas, bienes, obligaciones, contratos y sucesiones — la base del derecho privado hondureño.",
      "Para temas de familia o comercio, cruza esta lectura con el Código de Familia y el Código de Comercio. Las reformas se incorporan tras publicarse en La Gaceta y se explican en Actualizaciones Legales.",
    ],
    extraFaqs: [
      {
        question: "¿Qué materias regula el Código Civil de Honduras?",
        answer:
          "De forma general regula el derecho privado: personas, familia en lo que no esté en leyes especiales, bienes, obligaciones, contratos y sucesiones. Algunas materias tienen desarrollo en códigos o leyes especiales que deben leerse junto con el Civil.",
      },
      {
        question: "¿El Código Civil aplica a contratos mercantiles?",
        answer:
          "En muchos casos el Código de Comercio es la norma especial; el Civil opera de forma supletoria cuando la norma mercantil no dispone otra cosa. Siempre verifica ambos cuerpos y la jurisprudencia o doctrina aplicable a tu caso.",
      },
    ],
  },
  "constitucion-de-la-republica-de-honduras": {
    slug: "constitucion-de-la-republica-de-honduras",
    displayTitle: "Constitución de la República de Honduras",
    shortLabel: "Constitución",
    siblingSlugs: [
      "codigo-penal-honduras",
      "codigo-civil-honduras",
      "codigo-procesal-penal-honduras",
    ],
    seoIntro: [
      "Consulta gratis el texto vigente de la Constitución de la República de Honduras. Es la norma suprema: organiza el Estado, reconoce derechos fundamentales y fija el marco al que deben ajustarse las leyes y actos públicos.",
      "Úsala como punto de partida de cualquier investigación jurídica. Cuando una ley o reforma la desarrolle o la afecte, sigue el rastro en Actualizaciones Legales y en La Gaceta Oficial.",
    ],
    extraFaqs: [
      {
        question: "¿La Constitución de Honduras está por encima de las leyes ordinarias?",
        answer:
          "Sí. En el ordenamiento hondureño la Constitución es la norma fundamental. Las leyes, decretos y actos de autoridad deben interpretarse y aplicarse de conformidad con ella; los conflictos de constitucionalidad tienen vías procesales propias.",
      },
      {
        question: "¿Dónde veo reformas a la Constitución?",
        answer:
          "Las reformas constitucionales se publican en La Gaceta. En Biblioteca Legal HN actualizamos el texto vigente y publicamos resúmenes en Actualizaciones Legales cuando registramos un cambio relacionado.",
      },
    ],
  },
};

export function isHeadCodeSlug(slug: string | null | undefined): slug is HeadCodeSlug {
  return !!slug && (HEAD_CODE_SLUGS as readonly string[]).includes(slug);
}

export function getHeadCode(slug: string | null | undefined): HeadCodeConfig | null {
  if (!isHeadCodeSlug(slug)) return null;
  return HEAD_CODES[slug];
}

export function getHeadCodeDisplayTitle(
  slug: string | null | undefined,
  fallbackName: string
): string {
  const head = getHeadCode(slug);
  if (head) return head.displayTitle;
  const name = fallbackName.trim();
  return name.toLowerCase().includes("honduras") ? name : `${name} de Honduras`;
}

/** Guides that point at this collection slug (reverse of relatedCollections). */
export function getRelatedGuidesForCollection(slug: string): GuideRelated[] {
  return getAllGuides()
    .filter((g) => g.relatedCollections?.some((c) => c.slug === slug))
    .map((g) => ({ name: g.title, slug: g.slug }))
    .slice(0, 6);
}

export function sitemapPriorityForDocument(slug: string | null | undefined): number {
  if (isHeadCodeSlug(slug)) return 0.95;
  return 0.8;
}
