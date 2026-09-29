import type { Locale } from '@bendike/shared';
import en from './locales/en.json';
import enAdmin from './locales/en/admin.json';
import enApp from './locales/en/app.json';
import enAuth from './locales/en/auth.json';
import enBulletins from './locales/en/bulletins.json';
import enConsent from './locales/en/consent.json';
import enGear from './locales/en/gear.json';
import enLibrary from './locales/en/library.json';
import enPacking from './locales/en/packing.json';
import enWork from './locales/en/work.json';
import es from './locales/es.json';
import esAdmin from './locales/es/admin.json';
import esApp from './locales/es/app.json';
import esAuth from './locales/es/auth.json';
import esBulletins from './locales/es/bulletins.json';
import esConsent from './locales/es/consent.json';
import esGear from './locales/es/gear.json';
import esLibrary from './locales/es/library.json';
import esPacking from './locales/es/packing.json';
import esWork from './locales/es/work.json';
import pt from './locales/pt.json';
import ptAdmin from './locales/pt/admin.json';
import ptApp from './locales/pt/app.json';
import ptAuth from './locales/pt/auth.json';
import ptBulletins from './locales/pt/bulletins.json';
import ptConsent from './locales/pt/consent.json';
import ptGear from './locales/pt/gear.json';
import ptLibrary from './locales/pt/library.json';
import ptPacking from './locales/pt/packing.json';
import ptWork from './locales/pt/work.json';

export const AREAS = ['auth', 'consent', 'app', 'gear', 'work', 'library', 'packing', 'bulletins', 'admin'] as const;

export type Area = (typeof AREAS)[number];

export const COMMON_FILES: Record<Locale, Record<string, unknown>> = { en, es, pt };

export const AREA_FILES: Record<Locale, Record<string, unknown>[]> = {
  en: [enAuth, enConsent, enApp, enGear, enWork, enLibrary, enPacking, enBulletins, enAdmin],
  es: [esAuth, esConsent, esApp, esGear, esWork, esLibrary, esPacking, esBulletins, esAdmin],
  pt: [ptAuth, ptConsent, ptApp, ptGear, ptWork, ptLibrary, ptPacking, ptBulletins, ptAdmin],
};
