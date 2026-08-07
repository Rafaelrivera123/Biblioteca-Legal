export type TipPlacement = "top" | "bottom" | "left" | "right";

/** Preferred viewport space for the tip card + gap to the target. */
const TIP_VIEWPORT_GAP = 220;

function tipGap(): number {
  // Keep room for the tip without pushing short mobile viewports too far.
  return Math.min(
    TIP_VIEWPORT_GAP,
    Math.max(150, Math.round(window.innerHeight * 0.32))
  );
}

/**
 * Scroll so the tip's preferred side has room in the viewport.
 * Avoids Shepherd's default `block: "center"` on tall targets (e.g. collections
 * grid), which pins the top to the viewport edge and forces Floating UI flip
 * from `top` → `bottom`.
 */
export function scrollForTip(
  element: Element,
  placement: TipPlacement = "bottom"
): void {
  const rect = element.getBoundingClientRect();
  const gap = tipGap();
  let delta = 0;

  if (placement === "top") {
    delta = rect.top - gap;
  } else if (placement === "bottom") {
    const roomBelow = window.innerHeight - rect.bottom;
    if (roomBelow < gap) {
      delta = gap - roomBelow;
    } else if (rect.top < 72) {
      delta = rect.top - 72;
    }
  } else {
    const pad = 96;
    if (rect.top < pad) delta = rect.top - pad;
    else if (rect.bottom > window.innerHeight - pad) {
      delta = rect.bottom - (window.innerHeight - pad);
    }
  }

  if (Math.abs(delta) < 2) return;
  window.scrollBy({ top: delta, behavior: "smooth" });
}

function waitForScrollSettled(timeoutMs = 700): Promise<void> {
  return new Promise((resolve) => {
    let idle: ReturnType<typeof setTimeout> | undefined;
    let finished = false;

    const done = () => {
      if (finished) return;
      finished = true;
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("scrollend", onScrollEnd);
      if (idle) clearTimeout(idle);
      resolve();
    };

    const onScrollEnd = () => done();
    const onScroll = () => {
      if (idle) clearTimeout(idle);
      idle = setTimeout(done, 140);
    };

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("scrollend", onScrollEnd, { once: true });
    idle = setTimeout(done, timeoutMs);
  });
}

/** Scroll first, then resolve so Shepherd can show the tip in the final place. */
export async function prepareTipViewport(
  element: Element,
  placement: TipPlacement = "bottom"
): Promise<void> {
  scrollForTip(element, placement);
  await waitForScrollSettled();
}
