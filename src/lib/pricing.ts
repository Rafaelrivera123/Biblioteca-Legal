/** Shared pricing constants for Personal plans (USD). */

export const USD_MONTHLY_PRICE = 5.99;
export const HNL_RATE = 26.5;

/** Discount applied to 12× monthly when billed annually (0.30 = 30% off). */
export const ANNUAL_DISCOUNT = 0.3;

/** Annual = 12× monthly with ANNUAL_DISCOUNT off. */
export const USD_ANNUAL_PRICE =
  Math.round(USD_MONTHLY_PRICE * 12 * (1 - ANNUAL_DISCOUNT) * 100) / 100;

export const ANNUAL_DISCOUNT_PERCENT = Math.round(ANNUAL_DISCOUNT * 100);

export const FREE_SUMMARY_LIMIT = 20;
export const FREE_AI_CHAT_LIMIT = 10;

export function formatHnl(usd: number): string {
  return `L${(usd * HNL_RATE).toFixed(2)}`;
}

export function formatUsd(usd: number): string {
  return `$${usd.toFixed(2)}`;
}
