/**
 * Offline exchange rates (base: USD).
 * Used for currency conversion across the app.
 */
export const BASE_RATES: Record<string, number> = {
  USD: 1,
  IDR: 15850,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  SGD: 1.34,
  MYR: 4.47,
  THB: 35.2,
  AUD: 1.53,
  CNY: 7.24,
  KRW: 1330,
  INR: 83.1,
  PHP: 56.2,
  VND: 24500,
  SAR: 3.75,
};

/** Convert an amount from one currency to another using offline rates. */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
): number {
  if (from === to) return amount;
  const fromRate = BASE_RATES[from] || 1;
  const toRate = BASE_RATES[to] || 1;
  return (amount / fromRate) * toRate;
}
