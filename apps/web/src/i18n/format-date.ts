import type { Locale } from '@bendike/shared';

const INTL_LOCALES: Record<Locale, string> = { en: 'en-GB', es: 'es-AR', pt: 'pt-BR' };
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function intlLocale(language: string): string {
  const base = language.split('-')[0] as Locale;
  return INTL_LOCALES[base] ?? INTL_LOCALES.en;
}

export function formatDate(
  value: string | Date,
  language: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string {
  const dateOnly = typeof value === 'string' && DATE_ONLY.test(value);
  const date = typeof value === 'string' ? new Date(dateOnly ? `${value}T00:00:00Z` : value) : value;
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const resolved: Intl.DateTimeFormatOptions = dateOnly ? { timeZone: 'UTC', ...options } : options;
  return new Intl.DateTimeFormat(intlLocale(language), resolved).format(date);
}

export function formatMonth(value: string | Date, language: string): string {
  return formatDate(value, language, { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
