import { Timestamp } from 'firebase/firestore';
import { Language } from '@/lib/i18n/types';

/**
 * Format a Firestore Timestamp or Date to a localized string
 */
export function formatDate(
  date: Timestamp | Date | string,
  locale: string = 'id-ID',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Timestamp
    ? date.toDate()
    : typeof date === 'string'
      ? new Date(date)
      : date;

  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format date relative to today (Hari Ini, Kemarin, etc.)
 */
export function formatRelativeDate(date: Date, lang: Language = 'id'): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return lang === 'id' ? 'Hari Ini' : 'Today';
  if (diffDays === 1) return lang === 'id' ? 'Kemarin' : 'Yesterday';
  if (diffDays < 7) return lang === 'id' ? `${diffDays} hari lalu` : `${diffDays} days ago`;

  return formatDate(date, lang === 'id' ? 'id-ID' : 'en-US');
}

/**
 * Format time from date
 */
export function formatTime(date: Date, locale: string = 'id-ID'): string {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get start and end of month
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

/**
 * Get current month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/**
 * Group dates by relative period
 */
export function groupByDate<T extends { date: Date }>(
  items: T[],
  lang: Language = 'id'
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  items.forEach((item) => {
    const key = formatRelativeDate(item.date, lang);
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  });

  return groups;
}
