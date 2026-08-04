"use client";

import { trackEvent } from "@/lib/analytics";
import { USD_MONTHLY_PRICE } from "@/lib/pricing";
import { useEffect, useRef } from "react";

export default function PurchaseTracker({ isActive }: { isActive: boolean }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!isActive || tracked.current) return;
    tracked.current = true;
    trackEvent("purchase", {
      currency: "USD",
      value: USD_MONTHLY_PRICE,
    });
  }, [isActive]);

  return null;
}
