import type { Locale } from '@bendike/shared';

export function buildLocaleSwitchPath(pathname: string, search: string, newLocale: Locale): string {
  const segments = pathname.split('/');
  segments[1] = newLocale;
  return segments.join('/') + search;
}
