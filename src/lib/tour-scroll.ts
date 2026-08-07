export type TipPlacement = "top" | "bottom" | "left" | "right";

/** Preferred viewport space for the tip card + gap to the target. */
const TIP_VIEWPORT_GAP = 220;

function tipGap(): number {
  return Math.min(
    TIP_VIEWPORT_GAP,
    Math.max(150, Math.round(window.innerHeight * 0.32))
  );
}

type ScrollBehaviorOption = "instant" | "smooth";

/**
 * Scroll so the tip's preferred side has room in the viewport.
 * Prefer `instant` so Shepherd never shows during a smooth-scroll race
 * (tip appears → moves/hides → reappears).
 */
export function scrollForTip(
  element: Element,
  placement: TipPlacement = "bottom",
  behavior: ScrollBehaviorOption = "instant"
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
  window.scrollBy({
    top: delta,
    behavior: behavior === "smooth" ? "smooth" : "auto",
  });
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

/** Position the viewport, then resolve. Instant by default (no flicker). */
export async function prepareTipViewport(
  element: Element,
  placement: TipPlacement = "bottom",
  behavior: ScrollBehaviorOption = "instant"
): Promise<void> {
  scrollForTip(element, placement, behavior);
  if (behavior === "smooth") {
    await waitForScrollSettled();
    return;
  }
  // Instant scroll still needs a frame for layout/Floating UI to read geometry.
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
