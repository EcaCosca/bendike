import { applyLearnPatch, hasActiveFilters, parseLearnQuery } from './learn-query';

describe('parseLearnQuery', () => {
  test('reads every filter from the URL and drops values outside the fixed lists', () => {
    const params = new URLSearchParams('q= aad battery &topic=aad&type=video&level=student&lang=es&sort=title&page=3');

    expect(parseLearnQuery(params, 'es')).toEqual({
      q: 'aad battery',
      topic: 'aad',
      type: 'video',
      level: 'student',
      lang: 'es',
      sort: 'title',
      page: 3,
      pageSize: 24,
      locale: 'es',
    });
    // `film` is a real format, but not one the Learn page browses: it belongs to
    // the landing carousel, so the URL must not be able to ask for it here.
    expect(parseLearnQuery(new URLSearchParams('topic=bogus&type=film&page=-1'), 'en')).toEqual({
      q: undefined,
      topic: undefined,
      type: undefined,
      level: undefined,
      lang: undefined,
      sort: undefined,
      page: 1,
      pageSize: 24,
      locale: 'en',
    });
  });
});

describe('applyLearnPatch', () => {
  test('sets and clears keys and always goes back to the first page', () => {
    const params = new URLSearchParams('topic=aad&page=4&q=x');

    const next = applyLearnPatch(params, { topic: 'canopy', q: undefined });

    expect(next.toString()).toBe('topic=canopy');
  });
});

describe('hasActiveFilters', () => {
  test('is false for a bare query and true once any filter is set', () => {
    expect(hasActiveFilters(parseLearnQuery(new URLSearchParams('sort=title&page=2'), 'en'))).toBe(false);
    expect(hasActiveFilters(parseLearnQuery(new URLSearchParams('lang=pt'), 'en'))).toBe(true);
  });
});
