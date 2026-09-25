import type { EmbedProvider, LearnTopic } from '@bendike/shared';

export const PROVIDER_NAMES: Record<EmbedProvider, string> = { youtube: 'YouTube', spotify: 'Spotify', vimeo: 'Vimeo' };

export const TOPIC_LABELS: Record<LearnTopic, string> = {
  reserve_and_repack: 'Reserve and repack',
  aad: 'AAD',
  service_bulletins: 'Service bulletins',
  canopy: 'Canopy',
  wingsuit: 'Wingsuit',
  weather: 'Weather',
  first_rig: 'First rig',
  gear_care: 'Gear care',
  freefall: 'Freefall',
  safety_culture: 'Safety culture',
  instruments: 'Instruments',
  packing: 'Packing and rigging',
  reviews: 'Reviews',
  wingsuit_base: 'Wingsuit BASE',
};
