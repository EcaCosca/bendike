import type { LearnItemSummary } from '@bendike/shared';
import { filterLearnItems, pageLearnItems, sortLearnItems } from './learn-filter';

function item(slug: string, overrides: Partial<LearnItemSummary> = {}): LearnItemSummary {
  return {
    id: slug,
    slug,
    format: 'video',
    title: { en: slug, es: slug, pt: slug },
    summary: { en: '', es: '', pt: '' },
    author: null,
    sourceName: 'Source',
    url: `https://example.com/${slug}`,
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

describe('filterLearnItems', () => {
  test('matches every word of the search ignoring accents and case, across languages, author and source', () => {
    const items = [
      item('plegado', { title: { en: 'Reserve repack', es: 'Plegado de reserva', pt: 'Dobragem' } }),
      item('germain', { author: 'Brian Germain' }),
      item('exit', { sourceName: 'Exit Point' }),
    ];

    expect(filterLearnItems(items, { q: 'PLEGADO reserva' }).map((i) => i.slug)).toEqual(['plegado']);
    expect(filterLearnItems(items, { q: 'germáin' }).map((i) => i.slug)).toEqual(['germain']);
    expect(filterLearnItems(items, { q: 'exit point' }).map((i) => i.slug)).toEqual(['exit']);
    expect(filterLearnItems(items, { q: '   ' })).toHaveLength(3);
  });

  test('an item for everyone matches any level filter, a specific level only its own', () => {
    const items = [
      item('all', { level: 'all' }),
      item('student', { level: 'student' }),
      item('rigger', { level: 'rigger' }),
    ];

    expect(filterLearnItems(items, { level: 'student' }).map((i) => i.slug)).toEqual(['all', 'student']);
    expect(filterLearnItems(items, { level: 'rigger' }).map((i) => i.slug)).toEqual(['all', 'rigger']);
  });
});

describe('sortLearnItems and pageLearnItems', () => {
  test('newest first breaks ties by position, and the page size is capped', () => {
    const items = [
      item('b', { createdAt: '2026-09-01T00:00:00.000Z', position: 1 }),
      item('a', { createdAt: '2026-09-01T00:00:00.000Z', position: 0 }),
      item('c', { createdAt: '2026-09-02T00:00:00.000Z' }),
    ];

    expect(sortLearnItems(items, {}).map((i) => i.slug)).toEqual(['c', 'a', 'b']);
    expect(pageLearnItems(items, { pageSize: 500 }).pageSize).toBe(48);
    expect(pageLearnItems(items, { page: 0 }).page).toBe(1);
  });
});
