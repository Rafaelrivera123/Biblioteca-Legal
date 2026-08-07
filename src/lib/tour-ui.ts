/**
 * Shared Shepherd tour chrome: light elegant card + hand-drawn curved arrow.
 */

export const TOUR_STEP_CLASS = "blhn-tour-step";

export const shepherdTourOptions = {
  useModalOverlay: true,
  defaultStepOptions: {
    cancelIcon: { enabled: true },
    scrollTo: { behavior: "smooth" as const, block: "center" as const },
    classes: TOUR_STEP_CLASS,
    modalOverlayOpeningPadding: 12,
    modalOverlayOpeningRadius: 12,
    arrow: false,
  },
};

type Point = { x: number; y: number };

function edgePoint(
  rect: DOMRect,
  toward: Point
): Point {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX > absY) {
    // hit left/right edge
    const x = dx > 0 ? rect.right : rect.left;
    const t = absX === 0 ? 0 : (x - cx) / dx;
    return { x, y: cy + dy * t };
  }
  const y = dy > 0 ? rect.bottom : rect.top;
  const t = absY === 0 ? 0 : (y - cy) / dy;
  return { x: cx + dx * t, y };
}

function arrowHead(tip: Point, from: Point, size = 14): string {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
  const spread = Math.PI / 5;
  const a1 = angle + Math.PI - spread;
  const a2 = angle + Math.PI + spread;
  const p1 = {
    x: tip.x + Math.cos(a1) * size,
    y: tip.y + Math.sin(a1) * size,
  };
  const p2 = {
    x: tip.x + Math.cos(a2) * size,
    y: tip.y + Math.sin(a2) * size,
  };
  // Two open strokes like a sketched arrowhead
  return `M ${p1.x} ${p1.y} L ${tip.x} ${tip.y} M ${p2.x} ${p2.y} L ${tip.x} ${tip.y}`;
}

/**
 * Draws a hand-drawn curved arrow from the tip card toward the highlighted target.
 * Returns a cleanup function.
 */
export function mountSketchArrow(
  targetSelector: string,
  tipElement: HTMLElement | null
): () => void {
  const target = document.querySelector(targetSelector);
  if (!target || !tipElement) return () => {};

  const existing = document.getElementById("blhn-sketch-arrow");
  if (existing) existing.remove();

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "blhn-sketch-arrow";
  svg.setAttribute("class", "blhn-sketch-arrow");
  svg.setAttribute("aria-hidden", "true");
  Object.assign(svg.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "10000",
    overflow: "visible",
  });

  const draw = () => {
    const tipRect = tipElement.getBoundingClientRect();
    const targetRect = (target as Element).getBoundingClientRect();
    if (tipRect.width === 0 || targetRect.width === 0) return;

    const tipCenter: Point = {
      x: tipRect.left + tipRect.width / 2,
      y: tipRect.top + tipRect.height / 2,
    };
    const targetCenter: Point = {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2,
    };

    // Start near tip edge facing the target; end just outside target edge
    const start = edgePoint(tipRect, targetCenter);
    const end = edgePoint(targetRect, tipCenter);

    // Pull end slightly outward so arrowhead doesn't sit on the highlight ring
    const outX = end.x - targetCenter.x;
    const outY = end.y - targetCenter.y;
    const outLen = Math.hypot(outX, outY) || 1;
    const tipPoint: Point = {
      x: end.x + (outX / outLen) * 10,
      y: end.y + (outY / outLen) * 10,
    };

    // Control points for a soft S-curve (hand-drawn feel)
    const midX = (start.x + tipPoint.x) / 2;
    const midY = (start.y + tipPoint.y) / 2;
    const dx = tipPoint.x - start.x;
    const dy = tipPoint.y - start.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = Math.min(56, len * 0.28);
    // Perpendicular offset
    const nx = -dy / len;
    const ny = dx / len;
    // Alternate bend based on relative position for nicer arcs
    const side = tipCenter.x < targetCenter.x ? 1 : -1;
    const c1: Point = {
      x: start.x + dx * 0.35 + nx * bend * side,
      y: start.y + dy * 0.35 + ny * bend * side,
    };
    const c2: Point = {
      x: start.x + dx * 0.7 + nx * bend * 0.45 * side,
      y: start.y + dy * 0.7 + ny * bend * 0.45 * side,
    };

    const curve = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${tipPoint.x} ${tipPoint.y}`;
    const head = arrowHead(tipPoint, c2, 15);

    svg.innerHTML = `
      <defs>
        <filter id="blhn-arrow-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#1E2A38" flood-opacity="0.18"/>
        </filter>
      </defs>
      <path d="${curve}" fill="none" stroke="#1E2A38" stroke-width="2.4"
        stroke-linecap="round" stroke-linejoin="round" filter="url(#blhn-arrow-soft)"
        pathLength="1" class="blhn-sketch-arrow-path" />
      <path d="${head}" fill="none" stroke="#1E2A38" stroke-width="2.4"
        stroke-linecap="round" stroke-linejoin="round" filter="url(#blhn-arrow-soft)"
        class="blhn-sketch-arrow-head" />
    `;
  };

  document.body.appendChild(svg);
  draw();

  const onResize = () => draw();
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onResize, true);

  // Shepherd repositions asynchronously
  const raf = requestAnimationFrame(draw);
  const t1 = window.setTimeout(draw, 50);
  const t2 = window.setTimeout(draw, 200);

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(t1);
    clearTimeout(t2);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onResize, true);
    svg.remove();
  };
}

/** Attach sketch arrow lifecycle to a Shepherd tour instance. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bindSketchArrowToTour(tour: any) {
  let cleanup: (() => void) | null = null;

  const clear = () => {
    cleanup?.();
    cleanup = null;
  };

  tour.on("show", () => {
    clear();
    const step = tour.getCurrentStep?.();
    const attach = step?.options?.attachTo;
    const selector =
      typeof attach?.element === "string" ? attach.element : null;
    if (!selector) return;

    requestAnimationFrame(() => {
      const tipEl = document.querySelector(
        ".shepherd-element.blhn-tour-step"
      ) as HTMLElement | null;
      cleanup = mountSketchArrow(selector, tipEl);
    });
  });

  tour.on("hide", clear);
  tour.on("complete", clear);
  tour.on("cancel", clear);

  return clear;
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
