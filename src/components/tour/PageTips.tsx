"use client";

import {
  getPageTipConfig,
  incrementPageVisits,
  pickTipForVisit,
  readTipsState,
  resetTipsState,
  resolvePageTipKey,
} from "@/lib/onboarding-tips";
import { prepareTipViewport, type TipPlacement } from "@/lib/tour-scroll";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

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

export default function PageTips({ userId, hasSubscription }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tipsParam = searchParams.get("tips");
  const tourParam = searchParams.get("tour");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tourRef = useRef<any>(null);
  const runIdRef = useRef(0);
  const routerRef = useRef(router);
  routerRef.current = router;
  /** Skip one effect run after clearing ?tips=1 so the tip does not remount. */
  const skipNextRunRef = useRef(false);

  useEffect(() => {
    if (skipNextRunRef.current) {
      skipNextRunRef.current = false;
      return;
    }

    const force = tipsParam === "1" || tourParam === "1";
    const pageKey = resolvePageTipKey(pathname);
    if (!pageKey) return;

    const runId = ++runIdRef.current;
    let cancelled = false;
    let counted = false;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;

    const countVisit = () => {
      if (counted) return;
      counted = true;
      // Always count — including force replay — so clearing ?tips=1 cannot
      // immediately start the same tip again.
      incrementPageVisits(userId, pageKey);
    };

    const clearForceParams = () => {
      if (!force) return;
      skipNextRunRef.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete("tips");
      url.searchParams.delete("tour");
      const search = url.searchParams.toString();
      routerRef.current.replace(url.pathname + (search ? `?${search}` : ""));
    };

    const start = async () => {
      if (force) resetTipsState(userId);

      const config = getPageTipConfig(pageKey);
      if (!config) return;

      const visits = readTipsState(userId).pages[pageKey]?.visits ?? 0;
      const tip = pickTipForVisit(config, visits, { force });
      if (!tip) return;

      const el = await waitForElement(tip.attachTo);
      if (cancelled || runId !== runIdRef.current || !el) return;

      await new Promise<void>((resolve) => {
        delayTimer = setTimeout(resolve, 700);
      });
      if (cancelled || runId !== runIdRef.current) return;

      const placement = (tip.attachOn ?? "bottom") as TipPlacement;
      const attachSelector = tip.attachTo;

      // Scroll to final position BEFORE creating/showing the tip (instant).
      await prepareTipViewport(el, placement, "instant");
      if (cancelled || runId !== runIdRef.current) return;

      const Shepherd = (await import("shepherd.js")).default;
      if (cancelled || runId !== runIdRef.current) return;

      if (tourRef.current) {
        try {
          tourRef.current.cancel();
        } catch {
          /* ignore */
        }
        tourRef.current = null;
      }

      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          cancelIcon: { enabled: true },
          scrollTo: false,
          classes: "blhn-tour-step",
          modalOverlayOpeningPadding: 8,
          modalOverlayOpeningRadius: 8,
        },
      });

      tourRef.current = tour;

      const onDone = () => {
        countVisit();
        clearForceParams();
      };

      tour.on("complete", onDone);
      tour.on("cancel", onDone);

      tour.addStep({
        id: tip.id,
        title: tip.title,
        text: tip.text(hasSubscription),
        attachTo: {
          element: attachSelector,
          on: placement,
        },
        // Viewport already prepared; keep false so Shepherd never re-scrolls.
        scrollTo: false,
        buttons: [
          {
            text: "Entendido",
            classes: "blhn-btn-primary",
            action() {
              tour.complete();
            },
          },
        ],
      });

      tour.start();
    };

    void start();

    return () => {
      cancelled = true;
      if (delayTimer) clearTimeout(delayTimer);
      if (tourRef.current) {
        countVisit();
        try {
          tourRef.current.off("complete");
          tourRef.current.off("cancel");
          tourRef.current.cancel();
        } catch {
          /* ignore */
        }
        tourRef.current = null;
      }
    };
  }, [pathname, userId, hasSubscription, tipsParam, tourParam]);

  return null;
}
