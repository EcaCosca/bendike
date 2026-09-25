import type { TranslationOverrides } from './catalog';
import type { Locale, LocalizedText } from './locale';

export const LEARN_FORMATS = ['video', 'article', 'podcast', 'book', 'channel', 'course', 'page', 'film'] as const;
export type LearnFormat = (typeof LEARN_FORMATS)[number];

/**
 * A film sells without teaching — a season reel, a trip edit, one notable jump.
 * It is stored as a learn item so it stays editable in admin, but it is not
 * material anyone is meant to learn from, so the Learn page neither lists it nor
 * offers it as a filter. It reaches the landing carousel instead.
 */
export const LEARN_BROWSABLE_FORMATS = LEARN_FORMATS.filter((format) => format !== 'film');

export const LEARN_TOPICS = [
  'reserve_and_repack',
  'aad',
  'service_bulletins',
  'canopy',
  'wingsuit',
  'weather',
  'first_rig',
  'gear_care',
  'freefall',
  'safety_culture',
  'instruments',
  // Shelves the Squirrel TV library needs. The list above was written for the
  // rigger-facing Learn page, before the shop carried a manufacturer's own videos.
  'packing',
  'reviews',
  'wingsuit_base',
] as const;
export type LearnTopic = (typeof LEARN_TOPICS)[number];

export const LEARN_LEVELS = ['student', 'licensed', 'experienced', 'rigger', 'all'] as const;
export type LearnLevel = (typeof LEARN_LEVELS)[number];

export const CONTENT_LANGUAGES = ['en', 'es', 'pt', 'other'] as const;
export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];

export const EMBED_PROVIDERS = ['youtube', 'spotify', 'vimeo'] as const;
export type EmbedProvider = (typeof EMBED_PROVIDERS)[number];

export const LEARN_SORTS = ['newest', 'title'] as const;
export type LearnSort = (typeof LEARN_SORTS)[number];

export const LEARN_LINK_KINDS = ['product', 'brand', 'gear_model'] as const;
export type LearnLinkKind = (typeof LEARN_LINK_KINDS)[number];

export const LEARN_COPY_FIELDS = ['title', 'summary'] as const;
export type LearnCopyField = (typeof LEARN_COPY_FIELDS)[number];

export const LEARN_PAGE_SIZE = 24;
export const LEARN_MAX_PAGE_SIZE = 48;

export interface LearnEmbed {
  provider: EmbedProvider;
  id: string;
  kind: 'video' | 'show' | 'episode';
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;
const VIMEO_ID = /^\d{6,12}$/;

function hostOf(url: URL): string {
  return url.hostname.replace(/^www\./, '').replace(/^m\./, '');
}

function youtubeEmbed(url: URL): LearnEmbed | null {
  const host = hostOf(url);
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, first, second] = url.pathname.split('/');
    if (first === 'watch') {
      id = url.searchParams.get('v');
    } else if (first === 'shorts' || first === 'embed' || first === 'live') {
      id = second ?? null;
    }
  } else {
    return null;
  }
  return id && YOUTUBE_ID.test(id) ? { provider: 'youtube', id, kind: 'video' } : null;
}

function spotifyEmbed(url: URL): LearnEmbed | null {
  if (hostOf(url) !== 'open.spotify.com') {
    return null;
  }
  const segments = url.pathname.split('/').filter((segment) => segment && !segment.startsWith('intl-'));
  if (segments[0] === 'embed') {
    segments.shift();
  }
  const [kind, id] = segments;
  if ((kind === 'show' || kind === 'episode') && id && SPOTIFY_ID.test(id)) {
    return { provider: 'spotify', id, kind };
  }
  return null;
}

function vimeoEmbed(url: URL): LearnEmbed | null {
  const host = hostOf(url);
  let id: string | undefined;
  if (host === 'vimeo.com') {
    id = url.pathname.split('/')[1];
  } else if (host === 'player.vimeo.com') {
    const [, first, second] = url.pathname.split('/');
    id = first === 'video' ? second : undefined;
  } else {
    return null;
  }
  return id && VIMEO_ID.test(id) ? { provider: 'vimeo', id, kind: 'video' } : null;
}

export function parseEmbed(raw: string): LearnEmbed | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') {
    return null;
  }
  return youtubeEmbed(url) ?? spotifyEmbed(url) ?? vimeoEmbed(url);
}

export function embedSrc(embed: LearnEmbed): string {
  switch (embed.provider) {
    case 'youtube':
      return `https://www.youtube-nocookie.com/embed/${embed.id}`;
    case 'spotify':
      return `https://open.spotify.com/embed/${embed.kind === 'episode' ? 'episode' : 'show'}/${embed.id}`;
    case 'vimeo':
      return `https://player.vimeo.com/video/${embed.id}?dnt=1`;
  }
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export interface LearnLink {
  kind: LearnLinkKind;
  targetId: string;
}

export interface LearnItemSummary {
  id: string;
  slug: string;
  format: LearnFormat;
  title: LocalizedText;
  summary: LocalizedText;
  author: string | null;
  sourceName: string;
  url: string;
  embed: LearnEmbed | null;
  thumbnailUrl: string | null;
  contentLanguage: ContentLanguage;
  topics: LearnTopic[];
  level: LearnLevel;
  durationMinutes: number | null;
  publishedAt: string | null;
  buyUrl: string | null;
  affiliate: boolean;
  position: number;
  active: boolean;
  createdAt: string;
}

export interface LearnItemDetail extends LearnItemSummary {
  links: LearnLink[];
}

export interface LearnItemAdminDetail extends LearnItemDetail {
  translationOverrides: TranslationOverrides;
}

export interface LearnCollectionSummary {
  id: string;
  slug: string;
  title: LocalizedText;
  intro: LocalizedText;
  topic: LearnTopic;
  startHere: boolean;
  active: boolean;
  itemIds: string[];
}

export interface LearnCollectionDetail extends LearnCollectionSummary {
  items: LearnItemSummary[];
}

export interface LearnQuery {
  q?: string;
  topic?: LearnTopic;
  type?: LearnFormat;
  level?: LearnLevel;
  lang?: ContentLanguage;
  sort?: LearnSort;
  page?: number;
  pageSize?: number;
  locale?: Locale;
}

export interface LearnRigSection {
  gearItemId: string;
  label: string;
  items: LearnItemSummary[];
}

export interface CreateLearnItemRequestBody {
  slug: string;
  url: string;
  format: LearnFormat;
  title: string;
  summary: string;
  sourceName: string;
  contentLanguage: ContentLanguage;
  topics: LearnTopic[];
  level: LearnLevel;
  author?: string | null;
  thumbnailUrl?: string | null;
  durationMinutes?: number | null;
  publishedAt?: string | null;
  buyUrl?: string | null;
  affiliate?: boolean;
  position?: number;
}

export interface UpdateLearnItemRequestBody {
  url?: string;
  format?: LearnFormat;
  sourceName?: string;
  contentLanguage?: ContentLanguage;
  topics?: LearnTopic[];
  level?: LearnLevel;
  author?: string | null;
  thumbnailUrl?: string | null;
  durationMinutes?: number | null;
  publishedAt?: string | null;
  buyUrl?: string | null;
  affiliate?: boolean;
  position?: number;
  active?: boolean;
}

export interface UpdateLearnCopyRequestBody {
  field: LearnCopyField;
  locale: Locale;
  value: string;
}

export interface ReplaceLearnLinksRequestBody {
  links: LearnLink[];
}

export interface CreateLearnCollectionRequestBody {
  slug: string;
  title: string;
  intro: string;
  topic: LearnTopic;
  startHere?: boolean;
  itemIds: string[];
}

export interface UpdateLearnCollectionRequestBody {
  topic?: LearnTopic;
  startHere?: boolean;
  active?: boolean;
  itemIds?: string[];
}

export interface SuggestionInput {
  locale: Locale;
  url: string;
  reason: string;
  name: string;
}

const SUGGESTION_WORDS: Record<Locale, { opening: string; reason: string; from: string }> = {
  es: { opening: 'Hola Eca, te sugiero algo para la sección Aprender de Bendike:', reason: 'Por qué', from: 'De' },
  en: { opening: 'Hi Eca, a suggestion for the Learn section of Bendike:', reason: 'Why', from: 'From' },
  pt: { opening: 'Olá Eca, uma sugestão para a seção Aprender da Bendike:', reason: 'Por que', from: 'De' },
};

export function suggestionMessage(input: SuggestionInput): string {
  const words = SUGGESTION_WORDS[input.locale];
  const lines = [words.opening, input.url.trim()];
  if (input.reason.trim()) {
    lines.push(`${words.reason}: ${input.reason.trim()}`);
  }
  if (input.name.trim()) {
    lines.push(`${words.from}: ${input.name.trim()}`);
  }
  return lines.join('\n');
}
