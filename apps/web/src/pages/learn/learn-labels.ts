import type { EmbedProvider, LearnTopic } from '@bendike/shared';

export const PROVIDER_NAMES: Record<EmbedProvider, string> = { youtube: 'YouTube', spotify: 'Spotify', vimeo: 'Vimeo' };

export const TOPIC_LABEL_KEYS: Record<LearnTopic, string> = {
  reserve_and_repack: 'learn.topics.reserve_and_repack',
  aad: 'learn.topics.aad',
  service_bulletins: 'learn.topics.service_bulletins',
  canopy: 'learn.topics.canopy',
  wingsuit: 'learn.topics.wingsuit',
  weather: 'learn.topics.weather',
  first_rig: 'learn.topics.first_rig',
  gear_care: 'learn.topics.gear_care',
  freefall: 'learn.topics.freefall',
  safety_culture: 'learn.topics.safety_culture',
  instruments: 'learn.topics.instruments',
  packing: 'learn.topics.packing',
  reviews: 'learn.topics.reviews',
  wingsuit_base: 'learn.topics.wingsuit_base',
};
