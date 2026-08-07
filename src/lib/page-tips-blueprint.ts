import type { TipId } from "@/lib/onboarding-tips";

export type Pt = { x: number; y: number };
export type TipSize = { w: number; h: number };
export type ArrowWeight = "sm" | "md" | "lg" | "xl" | "ninguna";

export type TipLayout = {
  tip: Pt;
  tipSize: TipSize;
  base: Pt;
  mid: Pt;
  pin: Pt;
  flecha: ArrowWeight;
};

/**
 * Lab blueprint (tips v3) — viewport % on 1440×900 laptop frame.
 * Keys match TipId from onboarding-tips.
 */
export const PAGE_TIP_LAYOUTS: Record<TipId, TipLayout> = {
  "global-chat": {
    tip: { x: 86.7, y: 51.5 },
    tipSize: { w: 300, h: 210 },
    base: { x: 88.2, y: 65.1 },
    mid: { x: 89.6, y: 78 },
    pin: { x: 88.4, y: 88.3 },
    flecha: "sm",
  },
  "global-search": {
    tip: { x: 85.7, y: 30.8 },
    tipSize: { w: 300, h: 210 },
    base: { x: 86.1, y: 45.2 },
    mid: { x: 86, y: 57.7 },
    pin: { x: 76.8, y: 62.4 },
    flecha: "sm",
  },
  collections: {
    tip: { x: 50.4, y: 50.7 },
    tipSize: { w: 300, h: 210 },
    base: { x: 42, y: 32 },
    mid: { x: 32, y: 28 },
    pin: { x: 13.8, y: 100 },
    flecha: "ninguna",
  },
  "article-tools": {
    tip: { x: 14.3, y: 32.4 },
    tipSize: { w: 300, h: 210 },
    base: { x: 8, y: 45.4 },
    mid: { x: 6.7, y: 49.2 },
    pin: { x: 6.9, y: 54.9 },
    flecha: "sm",
  },
  "ai-summary": {
    tip: { x: 14.6, y: 34.1 },
    tipSize: { w: 300, h: 210 },
    base: { x: 16.9, y: 47.4 },
    mid: { x: 17.8, y: 49.8 },
    pin: { x: 17.6, y: 55.3 },
    flecha: "sm",
  },
  "doc-chatbot": {
    tip: { x: 62.9, y: 36.7 },
    tipSize: { w: 300, h: 210 },
    base: { x: 66.1, y: 50.3 },
    mid: { x: 78.1, y: 81.5 },
    pin: { x: 92.2, y: 92.1 },
    flecha: "sm",
  },
  "mi-biblioteca": {
    tip: { x: 49.5, y: 49.7 },
    tipSize: { w: 300, h: 210 },
    base: { x: 42, y: 26 },
    mid: { x: 38, y: 18 },
    pin: { x: 52.8, y: 26.2 },
    flecha: "ninguna",
  },
};
