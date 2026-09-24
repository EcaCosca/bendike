export const HERO_CLIP = {
  src: '/about/kstag.mp4',
  srcMobile: '/about/kstag-m.mp4',
  poster: '/about/kstag-poster.webp',
  posterMobile: '/about/kstag-poster-m.webp',
  alt: 'Wingsuit proximity flight down an alpine valley',
};

/**
 * Slots in the Preparation grid that have no still photograph yet and take a
 * looping clip instead. Index matches CHAPTERS.preparation.labels.
 */
export const PREP_CLIPS: Record<number, string> = {
  4: 'twiner', // Winds and weather
  5: 'exitcliff', // Exit order
  7: 'gainer', // Geared up
};

/**
 * Captions describe what is actually in each frame, which is not always what the
 * working file name suggests — the trims landed elsewhere than planned.
 */
export interface VignetteItem {
  id: string;
  caption: string;
  alt: string;
}

export const VIGNETTE_BAND = {
  number: '—',
  title: 'The material',
  heading: 'Twelve seconds at a time.',
  body: 'Exit points, walls, valleys and landings. Every one of these was flown on gear that someone inspected, packed and signed for first — which is the whole reason the rest of this exists.',
};

export const VIGNETTES: VignetteItem[] = [
  { id: 'gainer', caption: 'The summit exit', alt: 'A figure standing on a summit at sunset beside a mast' },
  { id: 'exitcliff', caption: 'On the ledge', alt: 'A wingsuit pilot on an exit ledge above a valley' },
  { id: 'valley', caption: 'Off the top', alt: 'A wingsuit pilot dropping away from a cliff top' },
  { id: 'gearup', caption: 'Along the wall', alt: 'A wingsuit pilot flying close along a rock face' },
  { id: 'canopyup', caption: 'Two off the wall', alt: 'Two wingsuit pilots diving beside a cliff' },
  { id: 'orbit', caption: 'Flying two-up', alt: 'Two wingsuit pilots flying together above trees' },
  { id: 'wingsuit', caption: 'Down the valley', alt: 'Chest-camera view of a wingsuit flight down an alpine valley' },
  { id: 'proximity', caption: 'Proximity', alt: 'A wingsuit pilot close to the camera with mountains behind' },
  { id: 'bridge', caption: 'Under the bridge', alt: 'Drone view of a bridge with a canopy far below' },
  { id: 'twiner', caption: 'Last light', alt: 'A cliff edge above a valley at dusk' },
  { id: 'touchdown', caption: 'Touchdown', alt: 'An open canopy on the ground seen from above' },
  { id: 'ferrata', caption: 'Down safe', alt: 'A jumper unclipping from a harness on the grass after landing' },
];
