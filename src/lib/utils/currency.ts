/**
 * Map of currency codes to their preferred locale for formatting.
 */
const CURRENCY_LOCALE: Record<string, string> = {
  IDR: 'id-ID',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  SGD: 'en-SG',
  MYR: 'ms-MY',
  THB: 'th-TH',
  AUD: 'en-AU',
  CNY: 'zh-CN',
  KRW: 'ko-KR',
  INR: 'en-IN',
  PHP: 'en-PH',
  VND: 'vi-VN',
  SAR: 'ar-SA',
};

/** Currencies that should not show decimal places */
const ZERO_DECIMAL_CURRENCIES = ['IDR', 'JPY', 'KRW', 'VND'];

function getLocale(currency: string): string {
  return CURRENCY_LOCALE[currency] || 'en-US';
}

function getDecimals(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.includes(currency) ? 0 : 2;
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'IDR',
  locale?: string,
): string {
  const decimals = getDecimals(currency);
  return new Intl.NumberFormat(locale || getLocale(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Split a formatted currency into its symbol and numeric value.
 * Useful for masking the value while keeping the symbol visible.
 *
 * @returns { symbol: string; value: string }
 */
export function formatCurrencyParts(
  amount: number,
  currency: string = 'IDR',
): { symbol: string; value: string } {
  const decimals = getDecimals(currency);
  const formatter = new Intl.NumberFormat(getLocale(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const parts = formatter.formatToParts(amount);
  let symbol = '';
  let value = '';

  for (const part of parts) {
    const type = part.type as string;
    if (type === 'currency' || type === 'literal' && symbol.length > 0 && value.length === 0) {
      symbol += part.value;
    } else if (type !== 'currency') {
      value += part.value;
    }
  }

  return { symbol: symbol.trim(), value: value.trim() };
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(amount: number, locale: string = 'id-ID'): string {
  return new Intl.NumberFormat(locale).format(amount);
}

/**
 * Parse currency string back to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Get compact currency representation (e.g. 1.5jt, 500rb)
 */
export function formatCompactCurrency(amount: number, lang: string = 'id'): string {
  if (lang === 'id') {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}rb`;
    return amount.toString();
  }
  // English fallback
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toString();
}

/**
 * Calculate percentage safely
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((value / total) * 100), 100);
}
