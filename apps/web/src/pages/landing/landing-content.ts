export const HERO_LINKS = { primary: '/register', secondary: '#services' } as const;

export const ABOUT_TEASER_ASSETS = {
  displayName: 'Enrique “Eca” Coscarelli',
  portrait: '/about/eca-portrait.webp',
  to: '/about',
} as const;

/**
 * Clips that loop behind the films strip. Self-hosted in `public/about/vig`, the
 * same trims the About story uses — the Squirrel films themselves live on YouTube
 * and would need an iframe, which the cookie bar rightly holds back until a
 * visitor has said yes.
 */
export const FILM_BACKDROPS = [
  'valley',
  'proximity',
  'orbit',
  'wingsuit',
  'canopyup',
  'exitcliff',
  'gainer',
  'touchdown',
] as const;

export const DEALER_BRANDS = [
  { slug: 'squirrel', name: 'Squirrel', file: 'squirrel.svg', height: 48 },
  { slug: 'vigil', name: 'Vigil', file: 'vigil.png', height: 64 },
  { slug: 'flysight', name: 'FlySight', file: 'flysight.png', height: 40 },
] as const;

export { EN_LANDING_COPY, useLandingCopy } from './landing-copy';
export type { LandingCopy } from './landing-copy';
