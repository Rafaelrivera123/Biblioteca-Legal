"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

/** Percent of the visible stage frame (0–100). */
export type Pt = { x: number; y: number };

export type TipSize = { w: number; h: number };

/** Stroke thickness presets for the thick outline arrow. */
export type ArrowWeightId = "sm" | "md" | "lg" | "xl";

export const ARROW_WEIGHTS: {
  id: ArrowWeightId;
  label: string;
  /** Half-width of the shaft (px). */
  half: number;
  /** Head length along the tip direction. */
  headLen: number;
  /** Head half-width at the base (flare). */
  headHalf: number;
  /** Outline stroke. */
  stroke: number;
}[] = [
  { id: "sm", label: "Fina", half: 5, headLen: 22, headHalf: 14, stroke: 2.4 },
  { id: "md", label: "Media", half: 7, headLen: 30, headHalf: 18, stroke: 2.8 },
  { id: "lg", label: "Gruesa", half: 10, headLen: 40, headHalf: 24, stroke: 3.2 },
  { id: "xl", label: "Extra", half: 13, headLen: 52, headHalf: 30, stroke: 3.6 },
];

export const DEFAULT_TIP_SIZE: TipSize = { w: 300, h: 210 };

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function clampSize(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Quadratic control so the curve passes near mid as a bend handle. */
export function quadPath(start: Pt, mid: Pt, end: Pt): string {
  return `M ${start.x} ${start.y} Q ${mid.x} ${mid.y} ${end.x} ${end.y}`;
}

/** Point on the quadratic curve at t ∈ [0,1]. */
function quadAt(start: Pt, mid: Pt, end: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * start.x + 2 * u * t * mid.x + t * t * end.x,
    y: u * u * start.y + 2 * u * t * mid.y + t * t * end.y,
  };
}

/** Tangent of quadratic Bézier at t. */
function quadTangent(start: Pt, mid: Pt, end: Pt, t: number): Pt {
  // B'(t) = 2(1-t)(mid-start) + 2t(end-mid)
  const dx = 2 * (1 - t) * (mid.x - start.x) + 2 * t * (end.x - mid.x);
  const dy = 2 * (1 - t) * (mid.y - start.y) + 2 * t * (end.y - mid.y);
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

function fmt(p: Pt) {
  return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
}

/**
 * Single closed silhouette: shaft + pointed head.
 * - Inicio cerrado (tapa entre los dos lados)
 * - Sin barra extra en el cuello: un solo path continuo (como screenshot 2)
 */
function closedArrowPath(
  start: Pt,
  mid: Pt,
  end: Pt,
  half: number,
  headLen: number,
  headHalf: number
): string {
  const totalLen = (() => {
    let acc = 0;
    let prev = start;
    for (let i = 1; i <= 24; i++) {
      const p = quadAt(start, mid, end, i / 24);
      acc += Math.hypot(p.x - prev.x, p.y - prev.y);
      prev = p;
    }
    return acc || 1;
  })();

  // Shaft stops where the head begins
  const headFrac = Math.min(0.45, headLen / totalLen);
  const tNeck = Math.max(0.15, 1 - headFrac);

  const steps = 20;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tNeck;
    const p = quadAt(start, mid, end, t);
    const tan = quadTangent(start, mid, end, t);
    const nx = -tan.y;
    const ny = tan.x;
    left.push({ x: p.x + nx * half, y: p.y + ny * half });
    right.push({ x: p.x - nx * half, y: p.y - ny * half });
  }

  const tipTan = quadTangent(start, mid, end, 1);
  const tipN = { x: -tipTan.y, y: tipTan.x };
  const neckCenter = quadAt(start, mid, end, tNeck);
  // Wings sit at the head base (same depth as neck), wider than shaft
  const leftWing = {
    x: neckCenter.x + tipN.x * headHalf,
    y: neckCenter.y + tipN.y * headHalf,
  };
  const rightWing = {
    x: neckCenter.x - tipN.x * headHalf,
    y: neckCenter.y - tipN.y * headHalf,
  };

  // Outer outline, clockwise from closed start
  const parts: string[] = [`M ${fmt(left[0])}`];
  for (let i = 1; i < left.length; i++) parts.push(`L ${fmt(left[i])}`);
  parts.push(`L ${fmt(leftWing)}`);
  parts.push(`L ${fmt(end)}`);
  parts.push(`L ${fmt(rightWing)}`);
  for (let i = right.length - 1; i >= 0; i--) parts.push(`L ${fmt(right[i])}`);
  parts.push("Z"); // cierra el inicio
  return parts.join(" ");
}

/**
 * Contorno negro hueco, cerrado en el inicio, punta afilada continua.
 */
export function EditableArrowSvg({
  start,
  mid,
  end,
  weight,
  width,
  height,
  onDragWhole,
}: {
  start: Pt;
  mid: Pt;
  end: Pt;
  weight: ArrowWeightId;
  width: number;
  height: number;
  onDragWhole?: (dxPct: number, dyPct: number) => void;
}) {
  const w = ARROW_WEIGHTS.find((x) => x.id === weight) ?? ARROW_WEIGHTS[1];
  const d = closedArrowPath(start, mid, end, w.half, w.headLen, w.headHalf);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!onDragWhole) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragRef.current || !onDragWhole) return;
    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    const rect = svg?.getBoundingClientRect();
    const w = rect?.width || width;
    const h = rect?.height || height;
    if (!w || !h) return;
    const dx = ((e.clientX - dragRef.current.x) / w) * 100;
    const dy = ((e.clientY - dragRef.current.y) / h) * 100;
    dragRef.current = { x: e.clientX, y: e.clientY };
    onDragWhole(dx, dy);
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <svg
      className="absolute left-0 top-0 overflow-visible"
      width={width}
      height={height}
      aria-hidden
      style={{ pointerEvents: "none" }}
    >
      <g
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ pointerEvents: onDragWhole ? "auto" : "none" }}
        className={onDragWhole ? "cursor-grab touch-none active:cursor-grabbing" : undefined}
      >
        {/* Hit area */}
        <path d={d} fill="transparent" stroke="transparent" strokeWidth={24} />
        <path
          d={d}
          fill="#ffffff"
          stroke="#0a0a0a"
          strokeWidth={w.stroke}
          strokeLinejoin="round"
          strokeLinecap="butt"
        />
      </g>
    </svg>
  );
}

export function ArrowThumb({ id }: { id: ArrowWeightId }) {
  const start = { x: 12, y: 42 };
  const mid = { x: 48, y: 10 };
  const end = { x: 90, y: 28 };
  const w = ARROW_WEIGHTS.find((x) => x.id === id) ?? ARROW_WEIGHTS[1];
  const scale = 0.45;
  const d = closedArrowPath(
    start,
    mid,
    end,
    w.half * scale,
    w.headLen * scale,
    w.headHalf * scale
  );
  return (
    <svg viewBox="0 0 100 56" className="h-12 w-full" aria-hidden>
      <path
        d={d}
        fill="#fff"
        stroke="#0a0a0a"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TipCard({
  title,
  body,
  kicker = "Recorrido",
  size,
}: {
  title: string;
  body: string;
  kicker?: string;
  size: TipSize;
}) {
  const scale = size.w / DEFAULT_TIP_SIZE.w;
  const fontTitle = clampSize(16 * scale, 12, 22);
  const fontBody = clampSize(13 * scale, 11, 18);
  const fontSmall = clampSize(11 * scale, 9, 14);

  return (
    <div
      className="relative select-none rounded-[18px] border border-[#1E2A38]/10 bg-[#fbfaf7] p-4 shadow-[0_18px_40px_rgba(30,42,56,0.12)]"
      style={{ width: size.w, minHeight: size.h }}
    >
      <div className="mb-1 flex cursor-grab items-center gap-2 active:cursor-grabbing">
        <span
          className="font-semibold uppercase tracking-wide text-[#8a6d12]"
          style={{ fontSize: fontSmall }}
        >
          Arrastra · esquina ↘ redimensiona
        </span>
        <span className="ml-auto rounded-full bg-[#1E2A38]/5 px-2 py-0.5 text-[#1E2A38]/40" style={{ fontSize: fontSmall }}>
          ×
        </span>
      </div>
      <h3
        className="font-semibold tracking-tight text-[#1E2A38]"
        style={{ fontSize: fontTitle }}
      >
        {title}
      </h3>
      <span
        className="mt-1 inline-block rounded-full bg-[#D4AF37]/20 px-2 py-0.5 font-semibold uppercase tracking-wide text-[#8a6d12]"
        style={{ fontSize: fontSmall }}
      >
        {kicker}
      </span>
      <p className="mt-2 leading-relaxed text-[#4b5563]" style={{ fontSize: fontBody }}>
        {body}
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <span
          className="rounded-full border border-[#1E2A38]/20 px-3 py-1"
          style={{ fontSize: fontSmall }}
        >
          Anterior
        </span>
        <span
          className="rounded-full bg-[#1E2A38] px-3 py-1 text-white"
          style={{ fontSize: fontSmall }}
        >
          Siguiente
        </span>
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Optional helper: scroll iframe to a selector (does NOT show the tip). */
export async function scrollIframeToSelector(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  targetSelector: string | null
) {
  let doc: Document | null = null;
  for (let i = 0; i < 40; i++) {
    doc = iframeRef.current?.contentDocument ?? null;
    if (doc?.body && doc.readyState !== "loading") break;
    await wait(100);
  }
  if (!doc) return;
  const win = iframeRef.current?.contentWindow;
  if (targetSelector) {
    let target: Element | null = null;
    for (let i = 0; i < 40; i++) {
      target = doc.querySelector(targetSelector);
      if (target) break;
      await wait(100);
    }
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    win?.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function useDragPercent(
  frameRef: RefObject<HTMLDivElement | null>,
  setPos: (p: Pt) => void
) {
  const dragging = useRef(false);

  const onPointerDown = (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragging.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    setPos({
      x: clamp(((e.clientX - rect.left) / rect.width) * 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100),
    });
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}

function DragHandle({
  label,
  pos,
  drag,
  color,
}: {
  label: string;
  pos: Pt;
  drag: ReturnType<typeof useDragPercent>;
  color: string;
}) {
  return (
    <div
      className="pointer-events-auto absolute z-40 flex -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none flex-col items-center active:cursor-grabbing"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      title={label}
    >
      <div
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-white/95 shadow-sm"
        style={{ borderColor: color }}
      >
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      </div>
      <span
        className="mt-0.5 rounded px-1 py-px text-[8px] font-semibold leading-none text-white opacity-90"
        style={{ background: color }}
      >
        {label}
      </span>
    </div>
  );
}

export const LAB_VIEWPORT = {
  w: 1440,
  h: 900,
  label: "Laptop 16″ · 1440×900",
} as const;

/** Tip counts as centered within this % of 50,50. */
const CENTER_TOL = 0.75;

function tipCenterStatus(tip: Pt) {
  const dx = tip.x - 50;
  const dy = tip.y - 50;
  const centered =
    Math.abs(dx) <= CENTER_TOL && Math.abs(dy) <= CENTER_TOL;
  return { dx, dy, centered };
}

export function FreePositionStage({
  iframeRef,
  pageSrc,
  tipPos,
  setTipPos,
  tipSize,
  setTipSize,
  basePos,
  setBasePos,
  midPos,
  setMidPos,
  pinPos,
  setPinPos,
  weight,
  showArrow,
  popupVisible,
  tipTitle,
  tipBody,
  tipKicker,
  onIframeLoad,
}: {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  pageSrc: string;
  tipPos: Pt;
  setTipPos: (p: Pt) => void;
  tipSize: TipSize;
  setTipSize: (s: TipSize) => void;
  basePos: Pt;
  setBasePos: (p: Pt) => void;
  midPos: Pt;
  setMidPos: (p: Pt) => void;
  pinPos: Pt;
  setPinPos: (p: Pt) => void;
  weight: ArrowWeightId;
  showArrow: boolean;
  popupVisible: boolean;
  tipTitle: string;
  tipBody: string;
  tipKicker?: string;
  onIframeLoad?: () => void;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tipDrag = useDragPercent(overlayRef, setTipPos);
  const baseDrag = useDragPercent(overlayRef, setBasePos);
  const midDrag = useDragPercent(overlayRef, setMidPos);
  const pinDrag = useDragPercent(overlayRef, setPinPos);

  const baseRef = useRef(basePos);
  const midRef = useRef(midPos);
  const pinRef = useRef(pinPos);
  baseRef.current = basePos;
  midRef.current = midPos;
  pinRef.current = pinPos;

  const sizeRef = useRef(tipSize);
  sizeRef.current = tipSize;
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const [size, setSize] = useState({ w: LAB_VIEWPORT.w, h: LAB_VIEWPORT.h });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const measure = () => {
      const pad = 24;
      const availW = Math.max(320, shell.clientWidth - pad);
      const availH = Math.max(280, shell.clientHeight - pad);
      const s = Math.min(availW / LAB_VIEWPORT.w, availH / LAB_VIEWPORT.h, 1);
      setScale(s);
      setSize({ w: LAB_VIEWPORT.w, h: LAB_VIEWPORT.h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(shell);
    return () => ro.disconnect();
  }, []);

  const toPx = (p: Pt) => ({
    x: (p.x / 100) * size.w,
    y: (p.y / 100) * size.h,
  });

  const moveArrowWhole = (dxPct: number, dyPct: number) => {
    const nextBase = {
      x: clamp(baseRef.current.x + dxPct),
      y: clamp(baseRef.current.y + dyPct),
    };
    const nextMid = {
      x: clamp(midRef.current.x + dxPct),
      y: clamp(midRef.current.y + dyPct),
    };
    const nextPin = {
      x: clamp(pinRef.current.x + dxPct),
      y: clamp(pinRef.current.y + dyPct),
    };
    baseRef.current = nextBase;
    midRef.current = nextMid;
    pinRef.current = nextPin;
    setBasePos(nextBase);
    setMidPos(nextMid);
    setPinPos(nextPin);
  };

  const onResizeDown = (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: sizeRef.current.w,
      h: sizeRef.current.h,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onResizeMove = (e: ReactPointerEvent) => {
    if (!resizing.current) return;
    // Resize in screen px → logical px (undo CSS scale)
    const dx = (e.clientX - resizeStart.current.x) / (scale || 1);
    const dy = (e.clientY - resizeStart.current.y) / (scale || 1);
    setTipSize({
      w: clampSize(resizeStart.current.w + dx, 200, 520),
      h: clampSize(resizeStart.current.h + dy, 140, 480),
    });
  };
  const onResizeUp = () => {
    resizing.current = false;
  };

  const center = tipCenterStatus(tipPos);
  const centerLabel = center.centered
    ? "Centrado ✓ (50 · 50)"
    : `Fuera del centro · tip ${tipPos.x.toFixed(1)}%, ${tipPos.y.toFixed(1)}% · Δ ${center.dx >= 0 ? "+" : ""}${center.dx.toFixed(1)}x ${center.dy >= 0 ? "+" : ""}${center.dy.toFixed(1)}y`;

  return (
    <div
      ref={shellRef}
      className="relative flex h-[calc(100vh-7.5rem)] min-h-[520px] items-center justify-center overflow-hidden rounded-xl border border-black/15 bg-[#2a2f36]"
    >
      {/* Bezel / laptop frame */}
      <div
        className="relative shrink-0 overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/10"
        style={{
          width: LAB_VIEWPORT.w * scale,
          height: LAB_VIEWPORT.h * scale,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: LAB_VIEWPORT.w,
            height: LAB_VIEWPORT.h,
            transform: `scale(${scale})`,
          }}
        >
          <iframe
            ref={iframeRef}
            src={pageSrc}
            title="Página real"
            className="absolute inset-0 h-full w-full border-0 bg-white"
            onLoad={() => onIframeLoad?.()}
          />

          <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-10">
            {/* Center guides */}
            {popupVisible && (
              <>
                <div
                  className="absolute left-1/2 top-0 z-10 h-full w-px -translate-x-1/2"
                  style={{
                    background: center.centered
                      ? "rgba(16,185,129,0.55)"
                      : "rgba(255,255,255,0.28)",
                  }}
                />
                <div
                  className="absolute left-0 top-1/2 z-10 h-px w-full -translate-y-1/2"
                  style={{
                    background: center.centered
                      ? "rgba(16,185,129,0.55)"
                      : "rgba(255,255,255,0.28)",
                  }}
                />
                <div
                  className={`absolute left-1/2 top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                    center.centered
                      ? "border-emerald-400 bg-emerald-400/80"
                      : "border-white/80 bg-white/30"
                  }`}
                />
              </>
            )}

            {popupVisible && showArrow && size.w > 0 && (
              <EditableArrowSvg
                start={toPx(basePos)}
                mid={toPx(midPos)}
                end={toPx(pinPos)}
                weight={weight}
                width={size.w}
                height={size.h}
                onDragWhole={moveArrowWhole}
              />
            )}

            {popupVisible && (
              <div
                data-lab-tip
                className="pointer-events-auto absolute z-30 touch-none"
                style={{
                  left: `${tipPos.x}%`,
                  top: `${tipPos.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  onPointerDown={tipDrag.onPointerDown}
                  onPointerMove={tipDrag.onPointerMove}
                  onPointerUp={tipDrag.onPointerUp}
                >
                  <TipCard
                    title={tipTitle}
                    body={tipBody}
                    kicker={tipKicker}
                    size={tipSize}
                  />
                </div>
                <div
                  className="absolute bottom-1 right-1 z-50 flex h-6 w-6 cursor-se-resize items-center justify-center rounded bg-[#1E2A38] text-[10px] text-white shadow"
                  onPointerDown={onResizeDown}
                  onPointerMove={onResizeMove}
                  onPointerUp={onResizeUp}
                  title="Redimensionar"
                >
                  ↘
                </div>
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                  {Math.round(tipSize.w)}×{Math.round(tipSize.h)}px
                </div>
              </div>
            )}

            {popupVisible && showArrow && (
              <>
                <DragHandle label="Inicio" pos={basePos} drag={baseDrag} color="#0a0a0a" />
                <DragHandle label="Medio" pos={midPos} drag={midDrag} color="#b45309" />
                <DragHandle label="Fin" pos={pinPos} drag={pinDrag} color="#1d4ed8" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* HUD outside bezel */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 space-y-1.5">
        <div className="rounded-md bg-black/75 px-2.5 py-1 text-[11px] font-medium text-white">
          {LAB_VIEWPORT.label}
          {scale < 0.999 ? ` · vista ${Math.round(scale * 100)}%` : ""}
        </div>
        {popupVisible && (
          <div
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
              center.centered
                ? "bg-emerald-600 text-white"
                : "bg-amber-500/95 text-[#1a1200]"
            }`}
          >
            {centerLabel}
          </div>
        )}
      </div>

      {popupVisible && (
        <button
          type="button"
          className="pointer-events-auto absolute right-3 top-3 z-20 rounded-md bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#1E2A38] shadow"
          onClick={() => setTipPos({ x: 50, y: 50 })}
        >
          Centrar tip (50 · 50)
        </button>
      )}
    </div>
  );
}

export function LabShell({
  title,
  subtitle,
  nav,
  children,
}: {
  title: string;
  subtitle: string;
  nav: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#e8e6e1] text-[#1E2A38]">
      <header className="border-b border-black/10 bg-[#fbfaf7] px-4 py-3">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6d12]">
              Lab local · página real
            </p>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-0.5 max-w-3xl text-sm text-[#4b5563]">{subtitle}</p>
          </div>
          {nav}
        </div>
        <div className="mx-auto mt-2 flex max-w-[1800px] flex-wrap gap-2 text-[12px]">
          <span className="rounded-md bg-emerald-700 px-2.5 py-1 text-white">
            Scroll libre · viewport laptop 1440×900
          </span>
          <span className="rounded-md border bg-white px-2.5 py-1">
            Guías: cruz = centro · badge verde = tip centrado
          </span>
          <span className="rounded-md border bg-white px-2.5 py-1">
            «Centrar tip» → 50 · 50
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}

export function PhaseBadge({
  tipOn,
}: {
  tipOn: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        tipOn
          ? "bg-emerald-100 text-emerald-800"
          : "bg-sky-100 text-sky-900"
      }`}
    >
      {tipOn ? "Tip visible — edita o sigue scrolleando" : "Solo página — scroll libre"}
    </span>
  );
}

export type LabLayoutEntry = {
  id: string;
  label: string;
  tip: Pt;
  tipSize: TipSize;
  base: Pt;
  mid: Pt;
  pin: Pt;
  flecha: ArrowWeightId | "ninguna";
  updatedAt: string;
};

export type LabBlueprint = {
  lab: "tour" | "tips";
  version: 3;
  savedAt: string;
  steps: LabLayoutEntry[];
};

const storageKey = (lab: "tour" | "tips") => `blhn_lab_layouts_${lab}_v3`;

function normalizeEntry(
  raw: Partial<LabLayoutEntry> & { tip?: Pt; pin?: Pt }
): LabLayoutEntry | null {
  if (!raw.id || !raw.tip || !raw.pin) return null;
  const base =
    raw.base ??
    ({
      x: clamp(raw.tip.x + (raw.tip.x < raw.pin.x ? 8 : -8)),
      y: clamp(raw.tip.y),
    } as Pt);
  const mid =
    raw.mid ??
    ({
      x: clamp((base.x + raw.pin.x) / 2),
      y: clamp((base.y + raw.pin.y) / 2 - 8),
    } as Pt);
  const tipSize = raw.tipSize ?? DEFAULT_TIP_SIZE;
  const flecha =
    raw.flecha === "ninguna"
      ? "ninguna"
      : raw.flecha && ARROW_WEIGHTS.some((w) => w.id === raw.flecha)
        ? raw.flecha
        : "md";
  return {
    id: raw.id,
    label: raw.label ?? raw.id,
    tip: raw.tip,
    tipSize,
    base,
    mid,
    pin: raw.pin,
    flecha,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  };
}

export function loadLabLayouts(lab: "tour" | "tips"): Record<string, LabLayoutEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(lab));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<LabLayoutEntry>>;
    const out: Record<string, LabLayoutEntry> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const n = normalizeEntry({ ...v, id: v.id ?? k });
      if (n) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveLabLayout(
  lab: "tour" | "tips",
  entry: LabLayoutEntry
): Record<string, LabLayoutEntry> {
  const all = loadLabLayouts(lab);
  all[entry.id] = entry;
  localStorage.setItem(storageKey(lab), JSON.stringify(all));
  return all;
}

export function clearLabLayouts(lab: "tour" | "tips") {
  localStorage.removeItem(storageKey(lab));
}

export function buildBlueprint(
  lab: "tour" | "tips",
  layouts: Record<string, LabLayoutEntry>
): LabBlueprint {
  return {
    lab,
    version: 3,
    savedAt: new Date().toISOString(),
    steps: Object.values(layouts).sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export function blueprintToChatText(bp: LabBlueprint): string {
  const lines = [
    `=== BLHN LAB BLUEPRINT (${bp.lab}) v${bp.version} ===`,
    `savedAt: ${bp.savedAt}`,
    `steps: ${bp.steps.length}`,
    "",
    ...bp.steps.map(
      (s) =>
        [
          `--- ${s.label} [${s.id}] ---`,
          `tip: ${s.tip.x.toFixed(1)}, ${s.tip.y.toFixed(1)}`,
          `tipSize: ${Math.round(s.tipSize.w)}x${Math.round(s.tipSize.h)}`,
          `base: ${s.base.x.toFixed(1)}, ${s.base.y.toFixed(1)}`,
          `mid: ${s.mid.x.toFixed(1)}, ${s.mid.y.toFixed(1)}`,
          `pin: ${s.pin.x.toFixed(1)}, ${s.pin.y.toFixed(1)}`,
          `flecha: ${s.flecha}`,
        ].join("\n")
    ),
    "",
    "=== JSON ===",
    JSON.stringify(bp, null, 2),
  ];
  return lines.join("\n");
}

export function LabSavePanel({
  lab,
  stepId,
  stepLabel,
  tipPos,
  tipSize,
  basePos,
  midPos,
  pinPos,
  flecha,
  layouts,
  onLayoutsChange,
}: {
  lab: "tour" | "tips";
  stepId: string;
  stepLabel: string;
  tipPos: Pt;
  tipSize: TipSize;
  basePos: Pt;
  midPos: Pt;
  pinPos: Pt;
  flecha: ArrowWeightId | "ninguna";
  layouts: Record<string, LabLayoutEntry>;
  onLayoutsChange: (next: Record<string, LabLayoutEntry>) => void;
}) {
  const [copied, setCopied] = useState<"step" | "all" | null>(null);
  const saved = layouts[stepId];

  const entry = (): LabLayoutEntry => ({
    id: stepId,
    label: stepLabel,
    tip: { x: +tipPos.x.toFixed(1), y: +tipPos.y.toFixed(1) },
    tipSize: {
      w: Math.round(tipSize.w),
      h: Math.round(tipSize.h),
    },
    base: { x: +basePos.x.toFixed(1), y: +basePos.y.toFixed(1) },
    mid: { x: +midPos.x.toFixed(1), y: +midPos.y.toFixed(1) },
    pin: { x: +pinPos.x.toFixed(1), y: +pinPos.y.toFixed(1) },
    flecha,
    updatedAt: new Date().toISOString(),
  });

  const saveCurrent = () => {
    onLayoutsChange({ ...saveLabLayout(lab, entry()) });
  };

  const copyStep = async () => {
    const e = entry();
    const text = [
      `lab: ${lab}`,
      `paso: ${stepLabel}`,
      `id: ${stepId}`,
      `tip_x: ${e.tip.x}`,
      `tip_y: ${e.tip.y}`,
      `tip_w: ${e.tipSize.w}`,
      `tip_h: ${e.tipSize.h}`,
      `base_x: ${e.base.x}`,
      `base_y: ${e.base.y}`,
      `mid_x: ${e.mid.x}`,
      `mid_y: ${e.mid.y}`,
      `pin_x: ${e.pin.x}`,
      `pin_y: ${e.pin.y}`,
      `flecha: ${flecha}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("step");
    setTimeout(() => setCopied(null), 1500);
  };

  const copyAll = async () => {
    const next = saveLabLayout(lab, entry());
    onLayoutsChange({ ...next });
    await navigator.clipboard.writeText(blueprintToChatText(buildBlueprint(lab, next)));
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  };

  const wipe = () => {
    clearLabLayouts(lab);
    onLayoutsChange({});
  };

  const count = Object.keys(layouts).length;

  return (
    <div className="space-y-2 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6d12]">
        Guardar para el chat
      </p>
      <p className="text-[11px] leading-relaxed text-[#4b5563]">
        1) Coloca tip + flecha · 2) <strong>Guardar este paso</strong> · 3) Repite
        · 4) <strong>Copiar TODO</strong> y pégalo en el chat.
      </p>
      <button
        type="button"
        onClick={saveCurrent}
        className="w-full rounded-lg bg-[#1E2A38] px-3 py-2 text-sm font-medium text-white"
      >
        Guardar este paso
        {saved ? " ✓" : ""}
      </button>
      <button
        type="button"
        onClick={() => void copyStep()}
        className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
      >
        {copied === "step" ? "Copiado ✓" : "Copiar solo este paso"}
      </button>
      <button
        type="button"
        onClick={() => void copyAll()}
        className="w-full rounded-lg border border-[#1E2A38] bg-white px-3 py-2 text-sm font-medium"
      >
        {copied === "all"
          ? "¡Todo copiado! Pégalo en el chat"
          : `Copiar TODO (${count} guardados)`}
      </button>
      {count > 0 && (
        <div className="rounded-md bg-white/80 p-2 text-[11px]">
          <p className="font-semibold text-[#1E2A38]">Guardados:</p>
          <ul className="mt-1 space-y-0.5 text-[#4b5563]">
            {Object.values(layouts)
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((s) => (
                <li key={s.id}>
                  {s.label} · {s.tipSize.w}×{s.tipSize.h} · {s.flecha}
                </li>
              ))}
          </ul>
          <button
            type="button"
            onClick={wipe}
            className="mt-2 text-[11px] text-red-700 underline"
          >
            Borrar todos los guardados
          </button>
        </div>
      )}
    </div>
  );
}

export function snapToIframeSelector(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  overlayEl: HTMLElement | null,
  selector: string
): Pt | null {
  const iframe = iframeRef.current;
  const doc = iframe?.contentDocument;
  const target = doc?.querySelector(selector);
  if (!iframe || !target || !overlayEl) return null;
  const fr = overlayEl.getBoundingClientRect();
  const ir = iframe.getBoundingClientRect();
  const gr = target.getBoundingClientRect();
  return {
    x: clamp(((ir.left + gr.left + gr.width / 2 - fr.left) / fr.width) * 100),
    y: clamp(((ir.top + gr.top + gr.height / 2 - fr.top) / fr.height) * 100),
  };
}

export function labPageUrl(path: string) {
  const u = path.includes("?") ? `${path}&blhn_lab=1` : `${path}?blhn_lab=1`;
  return u;
}
