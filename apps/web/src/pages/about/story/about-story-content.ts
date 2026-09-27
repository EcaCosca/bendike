export const ABOUT_ASSET_BASE = '/about';

export const ABOUT_ASSETS = {
  flight: `${ABOUT_ASSET_BASE}/flight.mp4`,
  flightMobile: `${ABOUT_ASSET_BASE}/flight-m.mp4`,
  flightPoster: `${ABOUT_ASSET_BASE}/flight-poster.webp`,
  flightPosterMobile: `${ABOUT_ASSET_BASE}/flight-poster-m.webp`,
  flightTrack: `${ABOUT_ASSET_BASE}/flight-track.json`,
  prep: Array.from({ length: 8 }, (_, i) => `${ABOUT_ASSET_BASE}/prep-0${i + 1}`),
  loft: [`${ABOUT_ASSET_BASE}/loft-01`, `${ABOUT_ASSET_BASE}/loft-02`],
  pilot: `${ABOUT_ASSET_BASE}/pilot-01`,
  teach: `${ABOUT_ASSET_BASE}/teach-01`,
  kids: `${ABOUT_ASSET_BASE}/kids`,
  portrait: `${ABOUT_ASSET_BASE}/eca`,
} as const;

export function imageSources(base: string) {
  return {
    src: `${base}-1600.webp`,
    srcSet: `${base}-800.webp 800w, ${base}-1600.webp 1600w`,
  };
}

export type { AboutCopy } from './about-story-copy';
export { useAboutCopy } from './about-story-copy';
