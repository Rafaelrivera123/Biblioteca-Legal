/** Shared pricing constants for Personal plans (USD). */

export const USD_MONTHLY_PRICE = 5.99;
export const HNL_RATE = 26.5;

/** Annual = half of 12× monthly (6 months of value for a year). */
export const USD_ANNUAL_PRICE =
  Math.round(((USD_MONTHLY_PRICE * 12) / 2) * 100) / 100;

export const FREE_SUMMARY_LIMIT = 20;
export const FREE_AI_CHAT_LIMIT = 10;

export function formatHnl(usd: number): string {
  return `L${(usd * HNL_RATE).toFixed(2)}`;
}

export function formatUsd(usd: number): string {
  return `$${usd.toFixed(2)}`;
}
