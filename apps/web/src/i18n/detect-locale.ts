import type { Locale } from '@bendike/shared';
import { isLocale } from '@bendike/shared';

const STORAGE_KEY = 'bendike.locale';

export function detectLocale(options: { stored: string | null; browserLanguages: readonly string[] }): Locale {
  if (options.stored && isLocale(options.stored)) {
    return options.stored;
  }

  for (const language of options.browserLanguages) {
    const primarySubtag = language.split('-')[0]?.toLowerCase();
    if (primarySubtag && isLocale(primarySubtag)) {
      return primarySubtag;
    }
  }

  return 'en';
}

export function readStoredLocale(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable (private browsing, disabled storage): the choice just won't persist
  }
}

export function detectLocaleFromEnvironment(): Locale {
  return detectLocale({ stored: readStoredLocale(), browserLanguages: navigator.languages });
}
