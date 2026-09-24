import type { LearnItemDetail, LearnItemSummary } from '@bendike/shared';

export function learnSummary(slug: string, overrides: Partial<LearnItemSummary> = {}): LearnItemSummary {
  const title = slug.replace(/-/g, ' ');
  return {
    id: `id-${slug}`,
    slug,
    format: 'video',
    title: { en: title, es: `${title} ES`, pt: `${title} PT` },
    summary: { en: `${title} summary`, es: `${title} resumen`, pt: `${title} resumo` },
    author: null,
    sourceName: 'Vigil',
    url: `https://www.youtube.com/watch?v=${slug.slice(0, 11).padEnd(11, 'x')}`,
    embed: null,
    thumbnailUrl: null,
    contentLanguage: 'en',
    topics: ['aad'],
    level: 'all',
    durationMinutes: null,
    publishedAt: null,
    buyUrl: null,
    affiliate: false,
    position: 0,
    active: true,
    createdAt: '2026-09-24T00:00:00.000Z',
    ...overrides,
  };
}

export function learnItem(slug: string, overrides: Partial<LearnItemDetail> = {}): LearnItemDetail {
  return { ...learnSummary(slug), links: [], ...overrides };
}
