export const MAX_PAGE_TIP_VISITS = 5;

export type TipId =
  | "global-chat"
  | "global-search"
  | "collections"
  | "article-tools"
  | "ai-summary"
  | "doc-chatbot"
  | "mi-biblioteca";

export type PageTipKey = "home" | "collections" | "document" | "mi-biblioteca";

export type TipDefinition = {
  id: TipId;
  attachTo: string;
  attachOn?: "top" | "bottom" | "left" | "right";
  title: string;
  text: (hasSubscription: boolean) => string;
};

type PageTipConfig = {
  key: PageTipKey;
  /** Tip id for visit index 0..4. Article tools appear most often on documents. */
  sequence: TipId[];
  tips: TipDefinition[];
};

export const PAGE_TIP_CONFIGS: PageTipConfig[] = [
  {
    key: "home",
    sequence: [
      "global-chat",
      "global-search",
      "global-chat",
      "global-search",
      "global-chat",
    ],
    tips: [
      {
        id: "global-chat",
        attachTo: "#tour-global-chat",
        attachOn: "left",
        title: "Chat IA global",
        text: (hasSubscription) =>
          hasSubscription
            ? "Pregunta sobre cualquier ley hondureña. Tienes consultas ilimitadas con tu plan."
            : "Pregunta sobre cualquier ley hondureña. Con la cuenta gratis tienes 10 consultas de IA.",
      },
      {
        id: "global-search",
        attachTo: "#tour-global-search",
        attachOn: "bottom",
        title: "Buscador de artículos",
        text: () =>
          "Busca por número de artículo, nombre de la ley o en lenguaje natural. La IA te ayuda a encontrar el texto relevante.",
      },
    ],
  },
  {
    key: "collections",
    sequence: [
      "collections",
      "collections",
      "collections",
      "collections",
      "collections",
    ],
    tips: [
      {
        id: "collections",
        attachTo: "#tour-collections-grid",
        attachOn: "top",
        title: "Colección de leyes",
        text: () =>
          "Aquí están todas las leyes, códigos y reglamentos. Abre un documento para leer artículos, ver resúmenes IA y usar el asistente.",
      },
    ],
  },
  {
    key: "document",
    sequence: [
      "article-tools",
      "article-tools",
      "article-tools",
      "ai-summary",
      "doc-chatbot",
    ],
    tips: [
      {
        id: "article-tools",
        attachTo: "#tour-article-tools",
        attachOn: "left",
        title: "Resalta, guarda o comenta",
        text: (hasSubscription) =>
          hasSubscription
            ? "En cada artículo puedes resaltar con color, guardar un marcador o dejar una nota privada. Todo queda en Mi Biblioteca."
            : "En cada artículo puedes resaltar, guardar o dejar notas. Es una función del Plan Personal; los verás en Mi Biblioteca.",
      },
      {
        id: "ai-summary",
        attachTo: "#tour-ai-summary",
        attachOn: "bottom",
        title: "Resumen en lenguaje claro",
        text: (hasSubscription) =>
          hasSubscription
            ? "Cada artículo puede incluir un resumen IA que explica el texto en lenguaje claro."
            : "Los primeros 20 artículos de cada documento tienen resumen IA gratis. Con el plan ves todos.",
      },
      {
        id: "doc-chatbot",
        attachTo: "#tour-chatbot",
        attachOn: "top",
        title: "Asistente de este documento",
        text: (hasSubscription) =>
          hasSubscription
            ? "Haz preguntas solo sobre esta ley. El asistente responde con base en sus artículos."
            : "Haz preguntas sobre este documento. Comparte el cupo de 10 consultas IA de tu cuenta gratis.",
      },
    ],
  },
  {
    key: "mi-biblioteca",
    sequence: [
      "mi-biblioteca",
      "mi-biblioteca",
      "mi-biblioteca",
      "mi-biblioteca",
      "mi-biblioteca",
    ],
    tips: [
      {
        id: "mi-biblioteca",
        attachTo: "#tour-mi-biblioteca-tabs",
        attachOn: "bottom",
        title: "Tu biblioteca personal",
        text: () =>
          "Aquí viven tus documentos guardados, marcadores, destacados y notas. Úsalo para retomar lo que marcaste al leer.",
      },
    ],
  },
];

export function resolvePageTipKey(pathname: string): PageTipKey | null {
  if (pathname === "/") return "home";
  if (pathname === "/collections") return "collections";
  if (pathname.startsWith("/collections/")) return "document";
  if (pathname.startsWith("/mi-biblioteca")) return "mi-biblioteca";
  return null;
}

export function getPageTipConfig(key: PageTipKey) {
  return PAGE_TIP_CONFIGS.find((c) => c.key === key) ?? null;
}

type PageTipState = {
  visits: number;
};

export type OnboardingTipsState = {
  pages: Partial<Record<PageTipKey, PageTipState>>;
};

export function storageKeyForUser(userId: string) {
  return `blhn_page_tips_${userId}`;
}

export function readTipsState(userId: string): OnboardingTipsState {
  if (typeof window === "undefined") return { pages: {} };
  try {
    const raw = localStorage.getItem(storageKeyForUser(userId));
    if (!raw) return { pages: {} };
    const parsed = JSON.parse(raw) as OnboardingTipsState;
    return parsed?.pages ? parsed : { pages: {} };
  } catch {
    return { pages: {} };
  }
}

export function writeTipsState(userId: string, state: OnboardingTipsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKeyForUser(userId), JSON.stringify(state));
}

export function resetTipsState(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKeyForUser(userId));
}

export function pickTipForVisit(
  config: PageTipConfig,
  visits: number,
  options?: { force?: boolean }
): TipDefinition | null {
  if (!options?.force && visits >= MAX_PAGE_TIP_VISITS) return null;

  const index = Math.min(
    options?.force ? 0 : visits,
    config.sequence.length - 1
  );
  const tipId = config.sequence[index];
  return config.tips.find((t) => t.id === tipId) ?? null;
}

export function incrementPageVisits(userId: string, pageKey: PageTipKey) {
  const state = readTipsState(userId);
  const current = state.pages[pageKey] ?? { visits: 0 };
  state.pages[pageKey] = { visits: current.visits + 1 };
  writeTipsState(userId, state);
}
