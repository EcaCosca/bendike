import { applyFilterPatch, parseCatalogQuery, toApiQueryString } from './catalog-query';

describe('parseCatalogQuery', () => {
  test('defaults to page 1 with no filters', () => {
    expect(parseCatalogQuery(new URLSearchParams(), 'en')).toEqual({ page: 1, pageSize: 12, locale: 'en' });
  });

  test('reads every filter from the query string', () => {
    const params = new URLSearchParams(
      'category=wingsuits&brand=squirrel&availability=made-to-order&condition=used&sold=1&search=freak&sort=price-desc&page=3',
    );

    expect(parseCatalogQuery(params, 'es')).toEqual({
      categorySlug: 'wingsuits',
      brandSlug: 'squirrel',
      availability: 'made-to-order',
      condition: 'used',
      includeSold: true,
      search: 'freak',
      sort: 'price-desc',
      page: 3,
      pageSize: 12,
      locale: 'es',
    });
  });

  test.each(['0', '-2', 'abc', ''])('ignores an invalid page "%s"', (page) => {
    expect(parseCatalogQuery(new URLSearchParams({ page }), 'en').page).toBe(1);
  });

  test('ignores an unknown availability, sort or condition value', () => {
    const query = parseCatalogQuery(new URLSearchParams('availability=maybe&sort=random&condition=refurbished'), 'en');

    expect(query.availability).toBeUndefined();
    expect(query.sort).toBeUndefined();
    expect(query.condition).toBeUndefined();
  });

  test.each(['0', 'true', 'yes', ''])('sold=%s does not include sold items; only sold=1 does', (value) => {
    expect(parseCatalogQuery(new URLSearchParams({ sold: value }), 'en').includeSold).toBeUndefined();
  });
});

describe('applyFilterPatch', () => {
  test('sets a filter and resets to page 1', () => {
    const next = applyFilterPatch(new URLSearchParams('category=wingsuits&page=4'), { brand: 'squirrel' });

    expect(next.get('brand')).toBe('squirrel');
    expect(next.get('category')).toBe('wingsuits');
    expect(next.has('page')).toBe(false);
  });

  test('removes a filter when its value is empty', () => {
    const next = applyFilterPatch(new URLSearchParams('brand=squirrel&search=x'), { brand: undefined, search: '' });

    expect(next.has('brand')).toBe(false);
    expect(next.has('search')).toBe(false);
  });
});

describe('toApiQueryString', () => {
  test('serialises only the defined fields', () => {
    expect(toApiQueryString({ categorySlug: 'wingsuits', page: 2, pageSize: 12, locale: 'pt' })).toBe(
      '?categorySlug=wingsuits&page=2&pageSize=12&locale=pt',
    );
  });

  test('condition and includeSold are sent to the API', () => {
    expect(toApiQueryString({ condition: 'used', includeSold: true })).toBe('?condition=used&includeSold=true');
  });

  test('an empty query serialises to an empty string', () => {
    expect(toApiQueryString({})).toBe('');
  });
});
