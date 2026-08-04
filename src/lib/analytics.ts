/** Client-side GA4 helpers (requires GoogleAnalytics in website layout). */

type GtagFn = (...args: unknown[]) => void;

function gtag(): GtagFn | undefined {
  if (typeof window === "undefined") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).gtag as GtagFn | undefined;
}

export type AnalyticsEvent =
  | "sign_up"
  | "login"
  | "paywall_view"
  | "begin_checkout"
  | "purchase"
  | "free_ai_quota_exhausted"
  | "ai_summary_open";

export function trackEvent(
  event: AnalyticsEvent,
  params?: Record<string, string | number | boolean | undefined>
) {
  const fn = gtag();
  if (!fn) return;
  fn("event", event, params ?? {});
}
