/**
 * Shared Shepherd tour chrome: light elegant card + hand-drawn curved arrow.
 *
 * Arrow strategy: poll for `.shepherd-element.shepherd-enabled` + `.shepherd-target`
 * while a tour is active. This survives Shepherd's attachTo resolution quirks and
 * page navigations inside the guest tour.
 */

export const TOUR_STEP_CLASS = "blhn-tour-step";

export const shepherdTourOptions = {
  useModalOverlay: true,
  defaultStepOptions: {
    cancelIcon: { enabled: true },
    scrollTo: { behavior: "smooth" as const, block: "center" as const },
    classes: TOUR_STEP_CLASS,
    modalOverlayOpeningPadding: 16,
    modalOverlayOpeningRadius: 14,
    arrow: false,
  },
};

type Point = { x: number; y: number };

const ARROW_ID = "blhn-sketch-arrow";
const ARROW_COLOR = "#1E2A38";

function edgePoint(rect: DOMRect, toward: Point, inset = 0): Point {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;

  if (Math.abs(dx) > Math.abs(dy)) {
    const x = (dx > 0 ? rect.right : rect.left) - Math.sign(dx || 1) * inset;
    const t = dx === 0 ? 0 : (x - cx) / dx;
    return { x, y: cy + dy * t };
  }
  const y = (dy > 0 ? rect.bottom : rect.top) - Math.sign(dy || 1) * inset;
  const t = dy === 0 ? 0 : (y - cy) / dy;
  return { x: cx + dx * t, y };
}

function arrowHead(tip: Point, from: Point, size = 18): string {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
  const spread = Math.PI / 4.5;
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

function ensureSvg(): SVGSVGElement {
  let svg = document.getElementById(ARROW_ID) as unknown as SVGSVGElement | null;
  if (svg) return svg;

  svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = ARROW_ID;
  svg.setAttribute("class", "blhn-sketch-arrow");
  svg.setAttribute("aria-hidden", "true");
  Object.assign(svg.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "2147483000",
    overflow: "visible",
  });
  document.body.appendChild(svg);
  return svg;
}

function removeSvg() {
  document.getElementById(ARROW_ID)?.remove();
}

function drawArrow(tipEl: HTMLElement, targetEl: Element) {
  const tipRect = tipEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();
  if (tipRect.width < 2 || targetRect.width < 2) {
    removeSvg();
    return;
  }

  const tipCenter: Point = {
    x: tipRect.left + tipRect.width / 2,
    y: tipRect.top + tipRect.height / 2,
  };
  const targetCenter: Point = {
    x: targetRect.left + targetRect.width / 2,
    y: targetRect.top + targetRect.height / 2,
  };

  // Pull start/end slightly off each box so the curve is readable
  const start = edgePoint(tipRect, targetCenter, 2);
  let end = edgePoint(targetRect, tipCenter, -8);

  const outX = end.x - targetCenter.x;
  const outY = end.y - targetCenter.y;
  const outLen = Math.hypot(outX, outY) || 1;
  end = {
    x: end.x + (outX / outLen) * 12,
    y: end.y + (outY / outLen) * 12,
  };

  let dx = end.x - start.x;
  let dy = end.y - start.y;
  let len = Math.hypot(dx, dy) || 1;

  // If FloatingUI parked the tip almost on top of the target, nudge the start
  // outward so we still get a visible sketch curve.
  if (len < 40) {
    const nx = -dy / len;
    const ny = dx / len;
    start.x -= nx * 36 + dx * 0.15;
    start.y -= ny * 36 + dy * 0.15;
    dx = end.x - start.x;
    dy = end.y - start.y;
    len = Math.hypot(dx, dy) || 1;
  }

  const bend = Math.max(28, Math.min(72, len * 0.35));
  const nx = -dy / len;
  const ny = dx / len;
  const side = tipCenter.x <= targetCenter.x ? 1 : -1;
  const c1: Point = {
    x: start.x + dx * 0.3 + nx * bend * side,
    y: start.y + dy * 0.3 + ny * bend * side,
  };
  const c2: Point = {
    x: start.x + dx * 0.7 + nx * bend * 0.35 * side,
    y: start.y + dy * 0.7 + ny * bend * 0.35 * side,
  };

  const curve = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
  const head = arrowHead(end, c2, 18);
  const svg = ensureSvg();

  svg.innerHTML = `
    <defs>
      <filter id="blhn-arrow-soft" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.6" flood-color="#1E2A38" flood-opacity="0.25"/>
      </filter>
    </defs>
    <path d="${curve}" fill="none" stroke="${ARROW_COLOR}" stroke-width="3"
      stroke-linecap="round" stroke-linejoin="round" filter="url(#blhn-arrow-soft)" />
    <path d="${head}" fill="none" stroke="${ARROW_COLOR}" stroke-width="3"
      stroke-linecap="round" stroke-linejoin="round" filter="url(#blhn-arrow-soft)" />
  `;
}

function findActivePair(): { tip: HTMLElement; target: Element } | null {
  const tip = document.querySelector(
    ".shepherd-element.shepherd-enabled"
  ) as HTMLElement | null;
  if (!tip) return null;

  // Centered steps (welcome/finish) have no target — hide arrow
  if (tip.classList.contains("shepherd-centered")) {
    return null;
  }

  const target =
    document.querySelector(".shepherd-enabled.shepherd-target") ||
    document.querySelector(".shepherd-target");

  if (!target || tip.contains(target)) return null;
  return { tip, target };
}

/**
 * Keep a sketch arrow synced to the active Shepherd step for the life of a tour.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bindSketchArrowToTour(tour: any) {
  let timer: ReturnType<typeof setInterval> | null = null;
  let running = false;

  const tick = () => {
    const pair = findActivePair();
    if (pair) drawArrow(pair.tip, pair.target);
    else removeSvg();
  };

  const start = () => {
    if (running) return;
    running = true;
    tick();
    timer = setInterval(tick, 120);
    window.addEventListener("resize", tick);
    window.addEventListener("scroll", tick, true);
  };

  const stop = () => {
    running = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    window.removeEventListener("resize", tick);
    window.removeEventListener("scroll", tick, true);
    removeSvg();
  };

  tour.on("start", start);
  tour.on("show", () => {
    start();
    // FloatingUI settles after show
    window.setTimeout(tick, 40);
    window.setTimeout(tick, 160);
    window.setTimeout(tick, 400);
  });
  tour.on("complete", stop);
  tour.on("cancel", stop);

  // If tour was already started before bind (unlikely), start anyway on next show
  return stop;
}

/**
 * Kept for call-site compatibility. Arrow is owned by the tour watcher now.
 */
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
