"use client";

export type Pt = { x: number; y: number };

export type ArrowWeightId = "sm" | "md" | "lg" | "xl";

const WEIGHTS: Record<
  ArrowWeightId,
  { half: number; headLen: number; headHalf: number; stroke: number }
> = {
  sm: { half: 5, headLen: 22, headHalf: 14, stroke: 2.4 },
  md: { half: 7, headLen: 30, headHalf: 18, stroke: 2.8 },
  lg: { half: 10, headLen: 40, headHalf: 24, stroke: 3.2 },
  xl: { half: 13, headLen: 52, headHalf: 30, stroke: 3.6 },
};

function quadAt(start: Pt, mid: Pt, end: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * start.x + 2 * u * t * mid.x + t * t * end.x,
    y: u * u * start.y + 2 * u * t * mid.y + t * t * end.y,
  };
}

function quadTangent(start: Pt, mid: Pt, end: Pt, t: number): Pt {
  const dx = 2 * (1 - t) * (mid.x - start.x) + 2 * t * (end.x - mid.x);
  const dy = 2 * (1 - t) * (mid.y - start.y) + 2 * t * (end.y - mid.y);
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

function fmt(p: Pt) {
  return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
}

/** Closed hollow outline arrow (inicio cerrado, punta afilada). */
export function closedArrowPath(
  start: Pt,
  mid: Pt,
  end: Pt,
  half: number,
  headLen: number,
  headHalf: number
): string {
  let totalLen = 0;
  let prev = start;
  for (let i = 1; i <= 24; i++) {
    const p = quadAt(start, mid, end, i / 24);
    totalLen += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  totalLen = totalLen || 1;

  const headFrac = Math.min(0.45, headLen / totalLen);
  const tNeck = Math.max(0.15, 1 - headFrac);

  const steps = 20;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tNeck;
    const p = quadAt(start, mid, end, t);
    const tan = quadTangent(start, mid, end, t);
    left.push({ x: p.x + -tan.y * half, y: p.y + tan.x * half });
    right.push({ x: p.x - -tan.y * half, y: p.y - tan.x * half });
  }

  const tipTan = quadTangent(start, mid, end, 1);
  const tipN = { x: -tipTan.y, y: tipTan.x };
  const neckCenter = quadAt(start, mid, end, tNeck);
  const leftWing = {
    x: neckCenter.x + tipN.x * headHalf,
    y: neckCenter.y + tipN.y * headHalf,
  };
  const rightWing = {
    x: neckCenter.x - tipN.x * headHalf,
    y: neckCenter.y - tipN.y * headHalf,
  };

  const parts: string[] = [`M ${fmt(left[0])}`];
  for (let i = 1; i < left.length; i++) parts.push(`L ${fmt(left[i])}`);
  parts.push(`L ${fmt(leftWing)}`);
  parts.push(`L ${fmt(end)}`);
  parts.push(`L ${fmt(rightWing)}`);
  for (let i = right.length - 1; i >= 0; i--) parts.push(`L ${fmt(right[i])}`);
  parts.push("Z");
  return parts.join(" ");
}

export function TourArrow({
  start,
  mid,
  end,
  weight = "sm",
}: {
  start: Pt;
  mid: Pt;
  end: Pt;
  weight?: ArrowWeightId;
}) {
  const w = WEIGHTS[weight] ?? WEIGHTS.sm;
  const d = closedArrowPath(start, mid, end, w.half, w.headLen, w.headHalf);
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[10000] h-full w-full overflow-visible"
      aria-hidden
    >
      <path
        d={d}
        fill="#ffffff"
        stroke="#0a0a0a"
        strokeWidth={w.stroke}
        strokeLinejoin="round"
        strokeLinecap="butt"
      />
    </svg>
  );
}

export function pctToPx(p: Pt, vw: number, vh: number): Pt {
  return { x: (p.x / 100) * vw, y: (p.y / 100) * vh };
}
