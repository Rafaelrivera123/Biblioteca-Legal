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

function edgePoint(rect: DOMRect, toward: Point): Point {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX > absY) {
    const x = dx > 0 ? rect.right : rect.left;
    const t = absX === 0 ? 0 : (x - cx) / dx;
    return { x, y: cy + dy * t };
  }
  const y = dy > 0 ? rect.bottom : rect.top;
  const t = absY === 0 ? 0 : (y - cy) / dy;
  return { x: cx + dx * t, y };
}

function arrowHead(tip: Point, from: Point, size = 16): string {
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
  return `M ${p1.x} ${p1.y} L ${tip.x} ${tip.y} M ${p2.x} ${p2.y} L ${tip.x} ${tip.y}`;
}

function resolveTarget(attach: unknown): Element | null {
  if (!attach || typeof attach !== "object") return null;
  const element = (attach as { element?: unknown }).element;
  if (typeof element === "string") {
    return document.querySelector(element);
  }
  if (typeof element === "function") {
    try {
      const result = element();
      if (typeof result === "string") return document.querySelector(result);
      if (result instanceof Element) return result;
    } catch {
      return null;
    }
  }
  if (element instanceof Element) return element;
  return null;
}

function findTipElement(): HTMLElement | null {
  return (
    (document.querySelector(
      ".shepherd-element.shepherd-enabled"
    ) as HTMLElement | null) ||
    (document.querySelector(
      `.shepherd-element.${TOUR_STEP_CLASS}`
    ) as HTMLElement | null) ||
    (document.querySelector(".shepherd-element") as HTMLElement | null)
  );
}

/**
 * Draws a hand-drawn curved arrow from the tip card toward the highlighted target.
 * Returns a cleanup function.
 */
export function mountSketchArrow(
  target: Element,
  tipElement: HTMLElement
): () => void {
  const existing = document.getElementById("blhn-sketch-arrow");
  if (existing) existing.remove();

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "blhn-sketch-arrow";
  svg.setAttribute("class", "blhn-sketch-arrow");
  svg.setAttribute("aria-hidden", "true");
  Object.assign(svg.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "10050",
    overflow: "visible",
  });

  const draw = () => {
    const tipRect = tipElement.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (tipRect.width < 2 || targetRect.width < 2) return;

    const tipCenter: Point = {
      x: tipRect.left + tipRect.width / 2,
      y: tipRect.top + tipRect.height / 2,
    };
    const targetCenter: Point = {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2,
    };

    const start = edgePoint(tipRect, targetCenter);
    const end = edgePoint(targetRect, tipCenter);

    // Keep arrowhead just outside the highlight cutout
    const outX = end.x - targetCenter.x;
    const outY = end.y - targetCenter.y;
    const outLen = Math.hypot(outX, outY) || 1;
    const tipPoint: Point = {
      x: end.x + (outX / outLen) * 14,
      y: end.y + (outY / outLen) * 14,
    };

    const dx = tipPoint.x - start.x;
    const dy = tipPoint.y - start.y;
    const len = Math.hypot(dx, dy) || 1;
    if (len < 24) return; // tip overlapping target — skip tiny arrows

    const bend = Math.min(64, len * 0.32);
    const nx = -dy / len;
    const ny = dx / len;
    const side = tipCenter.x < targetCenter.x ? 1 : -1;
    const c1: Point = {
      x: start.x + dx * 0.35 + nx * bend * side,
      y: start.y + dy * 0.35 + ny * bend * side,
    };
    const c2: Point = {
      x: start.x + dx * 0.72 + nx * bend * 0.4 * side,
      y: start.y + dy * 0.72 + ny * bend * 0.4 * side,
    };

    const curve = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${tipPoint.x} ${tipPoint.y}`;
    const head = arrowHead(tipPoint, c2, 16);

    svg.innerHTML = `
      <defs>
        <filter id="blhn-arrow-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.4" flood-color="#1E2A38" flood-opacity="0.22"/>
        </filter>
      </defs>
      <path d="${curve}" fill="none" stroke="#1E2A38" stroke-width="2.6"
        stroke-linecap="round" stroke-linejoin="round" filter="url(#blhn-arrow-soft)"
        class="blhn-sketch-arrow-path" />
      <path d="${head}" fill="none" stroke="#1E2A38" stroke-width="2.6"
        stroke-linecap="round" stroke-linejoin="round" filter="url(#blhn-arrow-soft)"
        class="blhn-sketch-arrow-head" />
    `;
  };

  document.body.appendChild(svg);
  draw();

  const onResize = () => draw();
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onResize, true);

  const timers = [50, 150, 350, 600].map((ms) => window.setTimeout(draw, ms));
  const raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onResize, true);
    svg.remove();
  };
}

function waitForTipElement(timeout = 1200): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const existing = findTipElement();
    if (existing) return resolve(existing);

    const start = Date.now();
    const tick = () => {
      const found = findTipElement();
      if (found) return resolve(found);
      if (Date.now() - start > timeout) return resolve(null);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** Attach sketch arrow lifecycle to a Shepherd tour instance. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bindSketchArrowToTour(tour: any) {
  let cleanup: (() => void) | null = null;
  let generation = 0;

  const clear = () => {
    cleanup?.();
    cleanup = null;
  };

  const showArrowForStep = async (step: unknown) => {
    const myGen = ++generation;
    clear();

    const attach =
      step && typeof step === "object" && "options" in step
        ? (step as { options?: { attachTo?: unknown } }).options?.attachTo
        : null;

    const target = resolveTarget(attach);
    if (!target) return;

    const tipEl = await waitForTipElement();
    if (myGen !== generation || !tipEl) return;

    cleanup = mountSketchArrow(target, tipEl);
  };

  // Shepherd Tour emits "show" with { step } in recent versions; also try getCurrentStep.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tour.on("show", (event?: any) => {
    const step = event?.step ?? tour.getCurrentStep?.();
    void showArrowForStep(step);
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
