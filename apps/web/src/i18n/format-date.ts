import type { Locale } from '@bendike/shared';

const INTL_LOCALES: Record<Locale, string> = { en: 'en-GB', es: 'es-AR', pt: 'pt-BR' };

export function intlLocale(language: string): string {
  const base = language.split('-')[0] as Locale;
  return INTL_LOCALES[base] ?? INTL_LOCALES.en;
}

export function formatDate(
  value: string | Date,
  language: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(intlLocale(language), options).format(date);
}

export function formatMonth(value: string | Date, language: string): string {
  return formatDate(value, language, { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
