import { DEMO_DOCUMENT_SLUG } from "@/lib/guest-tour";

export type Pt = { x: number; y: number };
export type TipSize = { w: number; h: number };
export type ArrowWeight = "sm" | "md" | "lg" | "xl" | "ninguna";

export type TourLayout = {
  tip: Pt;
  tipSize: TipSize;
  base: Pt;
  mid: Pt;
  pin: Pt;
  flecha: ArrowWeight;
};

export type GuestTourStepId =
  | "welcome"
  | "search"
  | "chat"
  | "collections"
  | "article-tools"
  | "ai-summary"
  | "doc-chat"
  | "actualizaciones"
  | "gacetas"
  | "guias"
  | "subscriptions"
  | "finish";

export type GuestTourStep = {
  id: GuestTourStepId;
  title: string;
  text: string;
  /** Route to open before showing the tip. */
  path?: string;
  /** Scroll target; tip shows only after scroll settles. */
  target?: string;
  /** Lab layout; omit = centered card, no arrow. */
  layout?: TourLayout;
  primaryLabel?: string;
  secondaryLabel?: string;
};

const DOC = `/collections/${DEMO_DOCUMENT_SLUG}`;

/** Lab blueprint (tour v3) — viewport % on 1440×900 laptop frame. */
export const GUEST_TOUR_LAYOUTS: Record<string, TourLayout> = {
  search: {
    tip: { x: 16.1, y: 29.6 },
    tipSize: { w: 300, h: 210 },
    base: { x: 16.2, y: 43.3 },
    mid: { x: 14.3, y: 59.9 },
    pin: { x: 24.7, y: 66.8 },
    flecha: "md",
  },
  chat: {
    tip: { x: 87.8, y: 61.1 },
    tipSize: { w: 300, h: 210 },
    base: { x: 88.9, y: 74.5 },
    mid: { x: 88.6, y: 81 },
    pin: { x: 87.3, y: 89.6 },
    flecha: "md",
  },
  collections: {
    tip: { x: 49.6, y: 50.1 },
    tipSize: { w: 300, h: 210 },
    base: { x: 37.9, y: 52.2 },
    mid: { x: 31.6, y: 52.2 },
    pin: { x: 22.7, y: 46.3 },
    flecha: "md",
  },
  "article-tools": {
    tip: { x: 15.4, y: 43.6 },
    tipSize: { w: 300, h: 210 },
    base: { x: 12.4, y: 56.2 },
    mid: { x: 11.6, y: 61.9 },
    pin: { x: 9.5, y: 67.1 },
    flecha: "md",
  },
  "ai-summary": {
    tip: { x: 14.4, y: 43.7 },
    tipSize: { w: 300, h: 210 },
    base: { x: 13.3, y: 56.8 },
    mid: { x: 13, y: 61.6 },
    pin: { x: 14.9, y: 67.4 },
    flecha: "md",
  },
  "doc-chat": {
    tip: { x: 62.5, y: 49.4 },
    tipSize: { w: 300, h: 210 },
    base: { x: 63.5, y: 62.6 },
    mid: { x: 69.5, y: 83.8 },
    pin: { x: 92, y: 92.9 },
    flecha: "md",
  },
  actualizaciones: {
    tip: { x: 50, y: 49.8 },
    tipSize: { w: 300, h: 210 },
    base: { x: 50, y: 45 },
    mid: { x: 50, y: 45 },
    pin: { x: 50, y: 45 },
    flecha: "ninguna",
  },
  gacetas: {
    tip: { x: 49.9, y: 49.4 },
    tipSize: { w: 300, h: 210 },
    base: { x: 50, y: 45 },
    mid: { x: 50, y: 45 },
    pin: { x: 50, y: 45 },
    flecha: "ninguna",
  },
  guias: {
    tip: { x: 50.2, y: 49.5 },
    tipSize: { w: 300, h: 210 },
    base: { x: 50, y: 45 },
    mid: { x: 50, y: 45 },
    pin: { x: 50, y: 45 },
    flecha: "ninguna",
  },
  subscriptions: {
    tip: { x: 50, y: 80 },
    tipSize: { w: 300, h: 210 },
    base: { x: 50, y: 40 },
    mid: { x: 50, y: 40 },
    pin: { x: 50, y: 40 },
    flecha: "ninguna",
  },
};

export const GUEST_TOUR_STEPS: GuestTourStep[] = [
  {
    id: "welcome",
    title: "Bienvenido a Biblioteca Legal HN",
    text: "Te mostramos todo lo que puedes hacer aquí: leer leyes gratis, buscar artículos, usar IA y, si te suscribes, resaltar, guardar y anotar. Puedes cerrar el tour cuando quieras.",
    primaryLabel: "Comenzar",
  },
  {
    id: "search",
    title: "Buscador de artículos",
    text: "Busca en toda la legislación por número de artículo, nombre de la ley o en lenguaje natural. La IA te ayuda a encontrar el texto relevante. Disponible sin cuenta.",
    path: "/",
    target: "#tour-global-search",
    layout: GUEST_TOUR_LAYOUTS.search,
  },
  {
    id: "chat",
    title: "Chat IA global",
    text: "Pregunta sobre cualquier ley hondureña. Con cuenta gratis tienes 10 consultas de IA; con el Plan Personal son ilimitadas y puedes adjuntar archivos.",
    path: "/",
    target: "#tour-global-chat",
    layout: GUEST_TOUR_LAYOUTS.chat,
  },
  {
    id: "collections",
    title: "Colección de leyes",
    text: "Aquí está la biblioteca completa: códigos, leyes y reglamentos de Honduras. Puedes leer el texto completo gratis, sin crear cuenta.",
    path: "/collections",
    target: "#tour-collections-tip-target",
    layout: GUEST_TOUR_LAYOUTS.collections,
  },
  {
    id: "article-tools",
    title: "Resalta, guarda o comenta",
    text: "En cada artículo puedes resaltar con color, guardar un marcador o dejar una nota privada. Es del Plan Personal. Con cuenta, todo queda en Mi Biblioteca.",
    path: DOC,
    target: "#tour-article-tools",
    layout: GUEST_TOUR_LAYOUTS["article-tools"],
  },
  {
    id: "ai-summary",
    title: "Resumen en lenguaje claro",
    text: "Cada artículo puede incluir un resumen IA que explica el texto sin jerga. Los primeros 20 artículos de cada documento son gratis; con el plan ves todos.",
    path: DOC,
    target: "#tour-ai-summary",
    layout: GUEST_TOUR_LAYOUTS["ai-summary"],
  },
  {
    id: "doc-chat",
    title: "Asistente de este documento",
    text: "Haz preguntas solo sobre esta ley. El asistente responde con base en sus artículos. Ideal para estudiar o preparar un caso.",
    path: DOC,
    target: "#tour-chatbot",
    layout: GUEST_TOUR_LAYOUTS["doc-chat"],
  },
  {
    id: "actualizaciones",
    title: "Actualizaciones legales",
    text: "Reformas, leyes nuevas y derogaciones explicadas en lenguaje claro, con enlace a La Gaceta. Así te enteras de cambios sin leer el PDF completo.",
    path: "/actualizaciones",
    target: "#tour-actualizaciones-page",
    layout: GUEST_TOUR_LAYOUTS.actualizaciones,
  },
  {
    id: "gacetas",
    title: "Gacetas oficiales",
    text: "Consulta las Gacetas Oficiales publicadas. Complementa las actualizaciones cuando necesitas el documento oficial.",
    path: "/gacetas",
    target: "#tour-gacetas-page",
    layout: GUEST_TOUR_LAYOUTS.gacetas,
  },
  {
    id: "guias",
    title: "Guías prácticas",
    text: "Guías que explican temas legales de forma práctica: ideales para estudiantes, ciudadanos y profesionales que quieren orientación clara.",
    path: "/guias",
    target: "#tour-guias-page",
    layout: GUEST_TOUR_LAYOUTS.guias,
  },
  {
    id: "subscriptions",
    title: "Gratis vs Plan Personal",
    text: "Gratis: leer leyes, buscar, 20 resúmenes IA por documento y 10 chats. Plan Personal: resúmenes ilimitados, chat ilimitado, resaltar/guardar/notas y sin anuncios.",
    path: "/subscriptions",
    target: "#tour-subscriptions-page",
    layout: GUEST_TOUR_LAYOUTS.subscriptions,
  },
  {
    id: "finish",
    title: "Crea tu cuenta gratis",
    text: "Con una cuenta usas el cupo de IA, guardas documentos y, si te suscribes, desbloqueas resaltar, marcadores y notas en Mi Biblioteca. ¿Listo para empezar?",
    primaryLabel: "Crear cuenta",
    secondaryLabel: "Cerrar",
  },
];
