"use client";

import { TourArrow, pctToPx } from "@/components/tour/TourArrow";
import {
  getPageTipConfig,
  incrementPageVisits,
  pickTipForVisit,
  readTipsState,
  resetTipsState,
  resolvePageTipKey,
  type TipDefinition,
} from "@/lib/onboarding-tips";
import { PAGE_TIP_LAYOUTS, type TipLayout } from "@/lib/page-tips-blueprint";
import { prepareTipViewport, type TipPlacement } from "@/lib/tour-scroll";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  userId: string;
  hasSubscription: boolean;
}

function waitForElement(
  selector: string,
  timeout = 6000
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

function TipCard({
  title,
  body,
  width,
  height,
  onClose,
  onPrimary,
}: {
  title: string;
  body: string;
  width: number;
  height: number;
  onClose: () => void;
  onPrimary: () => void;
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
          Guía rápida
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
      <p
        className="mt-2 leading-relaxed text-[#4b5563]"
        style={{ fontSize: fontBody }}
      >
        {body}
      </p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onPrimary}
          className="rounded-full bg-[#1E2A38] px-3 py-1 text-white"
          style={{ fontSize: fontSmall }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

export default function PageTips({ userId, hasSubscription }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tipsParam = searchParams.get("tips");
  const tourParam = searchParams.get("tour");
  const runIdRef = useRef(0);
  const routerRef = useRef(router);
  routerRef.current = router;
  const skipNextRunRef = useRef(false);
  const countedRef = useRef(false);
  const pageKeyRef = useRef<ReturnType<typeof resolvePageTipKey>>(null);
  const forceRef = useRef(false);
  const shownRef = useRef(false);

  const [tip, setTip] = useState<TipDefinition | null>(null);
  const [layout, setLayout] = useState<TipLayout | null>(null);
  const [visible, setVisible] = useState(false);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    const measure = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const dismiss = useCallback(() => {
    if (!countedRef.current && pageKeyRef.current) {
      countedRef.current = true;
      incrementPageVisits(userId, pageKeyRef.current);
    }
    if (forceRef.current) {
      skipNextRunRef.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete("tips");
      url.searchParams.delete("tour");
      const search = url.searchParams.toString();
      routerRef.current.replace(url.pathname + (search ? `?${search}` : ""));
    }
    shownRef.current = false;
    setVisible(false);
    setTip(null);
    setLayout(null);
  }, [userId]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.self !== window.top ||
        new URLSearchParams(window.location.search).has("blhn_lab"))
    ) {
      return;
    }

    if (skipNextRunRef.current) {
      skipNextRunRef.current = false;
      return;
    }

    const force = tipsParam === "1" || tourParam === "1";
    const pageKey = resolvePageTipKey(pathname);
    pageKeyRef.current = pageKey;
    forceRef.current = force;
    countedRef.current = false;
    shownRef.current = false;

    if (!pageKey) {
      setVisible(false);
      setTip(null);
      setLayout(null);
      return;
    }

    const runId = ++runIdRef.current;
    let cancelled = false;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;

    setVisible(false);
    setTip(null);
    setLayout(null);

    const start = async () => {
      if (force) resetTipsState(userId);

      const config = getPageTipConfig(pageKey);
      if (!config) return;

      const visits = readTipsState(userId).pages[pageKey]?.visits ?? 0;
      const picked = pickTipForVisit(config, visits, { force });
      if (!picked) return;

      const el = await waitForElement(picked.attachTo);
      if (cancelled || runId !== runIdRef.current || !el) return;

      await new Promise<void>((resolve) => {
        delayTimer = setTimeout(resolve, 700);
      });
      if (cancelled || runId !== runIdRef.current) return;

      const placement = (picked.attachOn ?? "bottom") as TipPlacement;
      await prepareTipViewport(el, placement, "instant");
      if (cancelled || runId !== runIdRef.current) return;

      const tipLayout = PAGE_TIP_LAYOUTS[picked.id];
      if (!tipLayout) return;

      shownRef.current = true;
      setTip(picked);
      setLayout(tipLayout);
      setVisible(true);
    };

    void start();

    return () => {
      cancelled = true;
      if (delayTimer) clearTimeout(delayTimer);
      if (shownRef.current && !countedRef.current && pageKey) {
        countedRef.current = true;
        incrementPageVisits(userId, pageKey);
      }
      shownRef.current = false;
      setVisible(false);
      setTip(null);
      setLayout(null);
    };
  }, [pathname, userId, hasSubscription, tipsParam, tourParam]);

  if (!visible || !tip || !layout) return null;

  const showArrow = layout.flecha !== "ninguna" && vw > 0 && vh > 0;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/35" aria-hidden />

      {showArrow && (
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
          left: `${layout.tip.x}%`,
          top: `${layout.tip.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <TipCard
          title={tip.title}
          body={tip.text(hasSubscription)}
          width={layout.tipSize.w}
          height={layout.tipSize.h}
          onClose={dismiss}
          onPrimary={dismiss}
        />
      </div>
    </div>
  );
}
