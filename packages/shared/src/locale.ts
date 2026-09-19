export const LOCALES = ['en', 'es', 'pt'] as const;

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export type LocalizedText<T = string> = Record<Locale, T>;

export function pickLocalized(text: LocalizedText, locale: Locale): string {
  return text[locale] || text.en;
}
