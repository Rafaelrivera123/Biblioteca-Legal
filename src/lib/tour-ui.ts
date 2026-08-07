/**
 * Tour chrome: light tip card + sketch arrow that ALWAYS tracks the active step.
 *
 * Strategy (bulletproof):
 * 1. Start a MutationObserver + interval as soon as the tour is bound (don't wait for events).
 * 2. Find the visible `.shepherd-element` and its `.shepherd-target` (or [class*=shepherd-target]).
 * 3. Draw a full-viewport SVG arrow above everything (z-index max).
 * 4. Also pin a sketch arrow on the tip card edge facing the target (survives overlay quirks).
 */

export const TOUR_STEP_CLASS = "blhn-tour-step";

export const shepherdTourOptions = {
  useModalOverlay: true,
  defaultStepOptions: {
    cancelIcon: { enabled: true },
    scrollTo: { behavior: "smooth" as const, block: "center" as const },
    classes: TOUR_STEP_CLASS,
    modalOverlayOpeningPadding: 18,
    modalOverlayOpeningRadius: 14,
    arrow: false,
  },
};

type Point = { x: number; y: number };

const LAYER_ID = "blhn-sketch-arrow-layer";
const INLINE_CLASS = "blhn-inline-sketch-arrow";
const COLOR = "#1E2A38";

function edgePoint(rect: DOMRect, toward: Point, pad = 0): Point {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const x = (dx >= 0 ? rect.right : rect.left) + (dx >= 0 ? pad : -pad);
    const t = dx === 0 ? 0 : (x - cx) / dx;
    return { x, y: cy + dy * t };
  }
  const y = (dy >= 0 ? rect.bottom : rect.top) + (dy >= 0 ? pad : -pad);
  const t = dy === 0 ? 0 : (y - cy) / dy;
  return { x: cx + dx * t, y };
}

function headPath(tip: Point, from: Point, size = 20): string {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
  const spread = Math.PI / 4.2;
  const p1 = {
    x: tip.x + Math.cos(angle + Math.PI - spread) * size,
    y: tip.y + Math.sin(angle + Math.PI - spread) * size,
  };
  const p2 = {
    x: tip.x + Math.cos(angle + Math.PI + spread) * size,
    y: tip.y + Math.sin(angle + Math.PI + spread) * size,
  };
  return `M ${p1.x} ${p1.y} L ${tip.x} ${tip.y} M ${p2.x} ${p2.y} L ${tip.x} ${tip.y}`;
}

/** Hand-drawn curve path in local 0..100 space, pointing right. */
function sketchGlyph(rotateDeg: number): string {
  return `
    <svg viewBox="0 0 120 80" width="96" height="64" style="transform:rotate(${rotateDeg}deg);transform-origin:center;overflow:visible" aria-hidden="true">
      <path d="M 8 62 C 28 58, 48 30, 78 22 C 90 18, 100 20, 108 24"
        fill="none" stroke="${COLOR}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M 92 10 L 112 22 M 96 36 L 112 22"
        fill="none" stroke="${COLOR}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function findTip(): HTMLElement | null {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(".shepherd-element")
  );
  for (const el of nodes) {
    if (el.hidden) continue;
    const style = window.getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") continue;
    if (style.opacity === "0") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    return el;
  }
  return null;
}

function findTarget(tip: HTMLElement): Element | null {
  const candidates = [
    ...document.querySelectorAll(".shepherd-target"),
    ...document.querySelectorAll("[class*='shepherd-target']"),
  ];
  for (const el of candidates) {
    if (el === tip || tip.contains(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    return el;
  }
  return null;
}

function ensureLayer(): SVGSVGElement {
  let layer = document.getElementById(LAYER_ID) as unknown as SVGSVGElement | null;
  if (layer) return layer;
  layer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  layer.id = LAYER_ID;
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: "100vw",
    height: "100vh",
    margin: "0",
    padding: "0",
    overflow: "visible",
    pointerEvents: "none",
    zIndex: "2147483646",
  });
  document.documentElement.appendChild(layer);
  return layer;
}

function clearLayer() {
  document.getElementById(LAYER_ID)?.remove();
  document.querySelectorAll(`.${INLINE_CLASS}`).forEach((n) => n.remove());
}

function drawViewportArrow(tip: HTMLElement, target: Element) {
  const tipRect = tip.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const tipCenter = {
    x: tipRect.left + tipRect.width / 2,
    y: tipRect.top + tipRect.height / 2,
  };
  const targetCenter = {
    x: targetRect.left + targetRect.width / 2,
    y: targetRect.top + targetRect.height / 2,
  };

  const start = edgePoint(tipRect, targetCenter, 4);
  let end = edgePoint(targetRect, tipCenter, 10);

  // Push tip of arrow just outside the highlighted element
  const ox = end.x - targetCenter.x;
  const oy = end.y - targetCenter.y;
  const ol = Math.hypot(ox, oy) || 1;
  end = { x: end.x + (ox / ol) * 10, y: end.y + (oy / ol) * 10 };

  let dx = end.x - start.x;
  let dy = end.y - start.y;
  let len = Math.hypot(dx, dy) || 1;

  // Always force a readable curve, even when tip is very close
  if (len < 48) {
    const nx = -dy / len;
    const ny = dx / len;
    start.x -= nx * 40;
    start.y -= ny * 40;
    dx = end.x - start.x;
    dy = end.y - start.y;
    len = Math.hypot(dx, dy) || 1;
  }

  const bend = Math.max(32, Math.min(80, len * 0.38));
  const nx = -dy / len;
  const ny = dx / len;
  const side = tipCenter.x <= targetCenter.x ? 1 : -1;
  const c1 = {
    x: start.x + dx * 0.28 + nx * bend * side,
    y: start.y + dy * 0.28 + ny * bend * side,
  };
  const c2 = {
    x: start.x + dx * 0.72 + nx * bend * 0.3 * side,
    y: start.y + dy * 0.72 + ny * bend * 0.3 * side,
  };

  const layer = ensureLayer();
  layer.innerHTML = `
    <path d="M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}"
      fill="none" stroke="${COLOR}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${headPath(end, c2, 20)}"
      fill="none" stroke="${COLOR}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

function drawInlineArrow(tip: HTMLElement, target: Element) {
  tip.style.overflow = "visible";
  const content = tip.querySelector(".shepherd-content") as HTMLElement | null;
  if (content) content.style.overflow = "visible";

  let holder = tip.querySelector(`.${INLINE_CLASS}`) as HTMLElement | null;
  if (!holder) {
    holder = document.createElement("div");
    holder.className = INLINE_CLASS;
    tip.appendChild(holder);
  }

  const tipRect = tip.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const dx =
    targetRect.left +
    targetRect.width / 2 -
    (tipRect.left + tipRect.width / 2);
  const dy =
    targetRect.top +
    targetRect.height / 2 -
    (tipRect.top + tipRect.height / 2);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Place glyph on the tip edge facing the target
  const reach = Math.max(tipRect.width, tipRect.height) * 0.5 + 12;
  holder.innerHTML = sketchGlyph(0);
  Object.assign(holder.style, {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "96px",
    height: "64px",
    margin: "0",
    transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${reach}px)`,
    pointerEvents: "none",
    zIndex: "5",
    overflow: "visible",
  });
}

function syncArrow() {
  const tip = findTip();
  if (!tip) {
    clearLayer();
    return;
  }

  // Centered welcome/finish steps: no target arrow
  if (
    tip.classList.contains("shepherd-centered") ||
    tip.querySelector(".shepherd-centered")
  ) {
    clearLayer();
    return;
  }

  const target = findTarget(tip);
  if (!target) {
    clearLayer();
    return;
  }

  drawViewportArrow(tip, target);
  drawInlineArrow(tip, target);
}

/**
 * Bind arrow sync for the lifetime of a Shepherd tour.
 * Starts immediately — does not depend on tour events firing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bindSketchArrowToTour(_tour: any) {
  let stopped = false;
  let interval: ReturnType<typeof setInterval> | null = null;

  const tick = () => {
    if (stopped) return;
    try {
      syncArrow();
    } catch {
      /* ignore draw errors */
    }
  };

  // Kick off right away and keep polling while tour UI exists
  tick();
  interval = setInterval(tick, 100);
  window.addEventListener("resize", tick);
  window.addEventListener("scroll", tick, true);

  const observer = new MutationObserver(tick);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "hidden"],
  });

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (interval) clearInterval(interval);
    interval = null;
    window.removeEventListener("resize", tick);
    window.removeEventListener("scroll", tick, true);
    observer.disconnect();
    clearLayer();
  };

  // Also stop when tour ends if events work
  try {
    _tour?.on?.("complete", stop);
    _tour?.on?.("cancel", stop);
  } catch {
    /* ignore */
  }

  return stop;
}

/** No-op wrapper kept so call sites stay stable. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withSketchArrow(step: Record<string, any>) {
  return step;
}

export function tipCardHtml(title: string, body: string) {
  return `
    <div class="blhn-tip-card">
      <p class="blhn-tip-kicker">Biblioteca Legal</p>
      <h3 class="blhn-tip-title">${title}</h3>
      <p class="blhn-tip-body">${body}</p>
    </div>
  `;
}
