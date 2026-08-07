"use client";

import {
  getPageTipConfig,
  incrementPageVisits,
  pickTipForVisit,
  readTipsState,
  resetTipsState,
  resolvePageTipKey,
} from "@/lib/onboarding-tips";
import {
  bindSketchArrowToTour,
  shepherdTourOptions,
} from "@/lib/tour-ui";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tourRef = useRef<any>(null);
  const runIdRef = useRef(0);
  const arrowCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const force =
      searchParams.get("tips") === "1" || searchParams.get("tour") === "1";
    const pageKey = resolvePageTipKey(pathname);
    if (!pageKey) return;

    const runId = ++runIdRef.current;
    let cancelled = false;
    let counted = false;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;

    const countVisit = () => {
      if (counted || force) return;
      counted = true;
      incrementPageVisits(userId, pageKey);
    };

    const clearForceParams = () => {
      if (!force) return;
      const url = new URL(window.location.href);
      url.searchParams.delete("tips");
      url.searchParams.delete("tour");
      const search = url.searchParams.toString();
      router.replace(url.pathname + (search ? `?${search}` : ""));
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
      arrowCleanupRef.current?.();
      arrowCleanupRef.current = null;

      const tour = new Shepherd.Tour(shepherdTourOptions);
      tourRef.current = tour;
      arrowCleanupRef.current = bindSketchArrowToTour(tour);

      const onDone = () => {
        countVisit();
        clearForceParams();
        arrowCleanupRef.current?.();
        arrowCleanupRef.current = null;
      };

      tour.on("complete", onDone);
      tour.on("cancel", onDone);

      const body = tip.text(hasSubscription);
      tour.addStep({
        id: tip.id,
        title: tip.title,
        text: `<span class="blhn-tip-kicker">Guía rápida</span><p>${body}</p>`,
        attachTo: {
          element: tip.attachTo,
          on: tip.attachOn ?? "bottom",
        },
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
      arrowCleanupRef.current?.();
      arrowCleanupRef.current = null;
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
  }, [pathname, userId, hasSubscription, searchParams, router]);

  return null;
}
