/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'IDR',
  locale: string = 'id-ID'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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
