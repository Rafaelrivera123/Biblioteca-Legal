"use client";

import {
  GUEST_TOUR_STEPS,
  type GuestTourStep,
  type TourLayout,
} from "@/lib/guest-tour-blueprint";
import { GUEST_TOUR_EVENT } from "@/lib/guest-tour";
import { TourArrow, pctToPx } from "@/components/tour/TourArrow";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForElement(
  selector: string,
  timeout = 10000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);

    const start = Date.now();
    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      } else if (Date.now() - start > timeout) {
        observer.disconnect();
        resolve(null);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeout);
  });
}

function waitForScrollSettled(timeoutMs = 800): Promise<void> {
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

function TipCard({
  title,
  body,
  kicker,
  width,
  height,
  onClose,
  onBack,
  onPrimary,
  primaryLabel,
  showBack,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  body: string;
  kicker?: string;
  width: number;
  height: number;
  onClose: () => void;
  onBack?: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  showBack: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const scale = width / 300;
  const fontTitle = Math.max(12, Math.min(22, 16 * scale));
  const fontBody = Math.max(11, Math.min(18, 13 * scale));
  const fontSmall = Math.max(9, Math.min(14, 11 * scale));

  return (
    <div
      className="select-none rounded-[18px] border border-[#1E2A38]/10 bg-[#fbfaf7] p-4 shadow-[0_18px_40px_rgba(30,42,56,0.18)]"
      style={{ width, minHeight: height }}
      role="dialog"
      aria-label={title}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className="font-semibold uppercase tracking-wide text-[#8a6d12]"
          style={{ fontSize: fontSmall }}
        >
          Recorrido
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-full bg-[#1E2A38]/5 px-2 py-0.5 text-[#1E2A38]/50 hover:bg-[#1E2A38]/10"
          style={{ fontSize: fontSmall }}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
      <h3
        className="font-semibold tracking-tight text-[#1E2A38]"
        style={{ fontSize: fontTitle }}
      >
        {title}
      </h3>
      {kicker && (
        <span
          className="mt-1 inline-block rounded-full bg-[#D4AF37]/20 px-2 py-0.5 font-semibold uppercase tracking-wide text-[#8a6d12]"
          style={{ fontSize: fontSmall }}
        >
          {kicker}
        </span>
      )}
      <p
        className="mt-2 leading-relaxed text-[#4b5563]"
        style={{ fontSize: fontBody }}
      >
        {body}
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {showBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-[#1E2A38]/20 px-3 py-1 text-[#1E2A38]"
            style={{ fontSize: fontSmall }}
          >
            Anterior
          </button>
        )}
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="rounded-full border border-[#1E2A38]/20 px-3 py-1 text-[#1E2A38]"
            style={{ fontSize: fontSmall }}
          >
            {secondaryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onPrimary}
          className="rounded-full bg-[#1E2A38] px-3 py-1 text-white"
          style={{ fontSize: fontSmall }}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

export default function GuestTour() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const runId = useRef(0);
  const autoStartedRef = useRef(false);

  const step: GuestTourStep | undefined = GUEST_TOUR_STEPS[index];

  useEffect(() => {
    const measure = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const finish = useCallback(() => {
    runId.current += 1;
    setActive(false);
    setVisible(false);
    setIndex(0);
    if (new URL(window.location.href).searchParams.get("tour") === "guest") {
      const url = new URL(window.location.href);
      url.searchParams.delete("tour");
      const search = url.searchParams.toString();
      routerRef.current.replace(url.pathname + (search ? `?${search}` : ""));
    }
  }, []);

  const prepareStep = useCallback(async (stepIndex: number) => {
    const id = ++runId.current;
    setVisible(false);
    setIndex(stepIndex);

    const s = GUEST_TOUR_STEPS[stepIndex];
    if (!s) return;

    // Navigate if needed
    if (s.path && window.location.pathname !== s.path) {
      routerRef.current.push(s.path);
      if (s.target) {
        await waitForElement(s.target);
      } else {
        await wait(500);
      }
      if (id !== runId.current) return;
      await wait(200);
      if (id !== runId.current) return;
    } else if (s.target) {
      await waitForElement(s.target, 6000);
      if (id !== runId.current) return;
    }

    // ALWAYS scroll first, then show tip
    if (s.target) {
      const el = document.querySelector(s.target);
      if (!el && s.id === "ai-summary") {
        // Skip if resumen missing on first article
        if (id !== runId.current) return;
        await prepareStep(stepIndex + 1);
        return;
      }
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      await waitForScrollSettled();
      if (id !== runId.current) return;
      await wait(120);
    }

    if (id !== runId.current) return;
    setVisible(true);
  }, []);

  const startTour = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      (window.self !== window.top ||
        new URLSearchParams(window.location.search).has("blhn_lab"))
    ) {
      return;
    }
    setActive(true);
    void prepareStep(0);
  }, [prepareStep]);

  useEffect(() => {
    const onEvent = () => startTour();
    window.addEventListener(GUEST_TOUR_EVENT, onEvent);

    if (
      !autoStartedRef.current &&
      searchParams.get("tour") === "guest"
    ) {
      autoStartedRef.current = true;
      startTour();
    }

    return () => {
      window.removeEventListener(GUEST_TOUR_EVENT, onEvent);
    };
  }, [searchParams, startTour]);

  useEffect(() => {
    return () => {
      runId.current += 1;
    };
  }, []);

  if (!active || !step || !visible) {
    return null;
  }

  const layout: TourLayout | undefined = step.layout;
  const showArrow =
    !!layout && layout.flecha !== "ninguna" && vw > 0 && vh > 0;
  const tipW = layout?.tipSize.w ?? 300;
  const tipH = layout?.tipSize.h ?? 210;
  const tipX = layout?.tip.x ?? 50;
  const tipY = layout?.tip.y ?? 45;

  const isFinish = step.id === "finish";
  const primaryLabel =
    step.primaryLabel ??
    (index < GUEST_TOUR_STEPS.length - 1 ? "Siguiente" : "Cerrar");

  const goNext = () => {
    if (isFinish) {
      finish();
      routerRef.current.push("/sign-up");
      return;
    }
    if (index >= GUEST_TOUR_STEPS.length - 1) {
      finish();
      return;
    }
    void prepareStep(index + 1);
  };

  const goBack = () => {
    if (index <= 0) return;
    void prepareStep(index - 1);
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/35" aria-hidden />

      {showArrow && layout && (
        <TourArrow
          start={pctToPx(layout.base, vw, vh)}
          mid={pctToPx(layout.mid, vw, vh)}
          end={pctToPx(layout.pin, vw, vh)}
          weight={layout.flecha === "ninguna" ? "sm" : layout.flecha}
        />
      )}

      <div
        className="pointer-events-auto absolute z-[10001]"
        style={{
          left: `${tipX}%`,
          top: `${tipY}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <TipCard
          title={step.title}
          body={step.text}
          kicker="Recorrido"
          width={tipW}
          height={tipH}
          onClose={finish}
          showBack={index > 0}
          onBack={goBack}
          onPrimary={goNext}
          primaryLabel={primaryLabel}
          secondaryLabel={isFinish ? step.secondaryLabel : undefined}
          onSecondary={isFinish ? finish : undefined}
        />
      </div>
    </div>
  );
}
