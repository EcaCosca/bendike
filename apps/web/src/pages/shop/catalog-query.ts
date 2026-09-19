import type { Availability, CatalogQuery, Locale, ProductCondition, SortOrder } from '@bendike/shared';
import { PRODUCT_CONDITIONS } from '@bendike/shared';

export const PAGE_SIZE = 12;

const AVAILABILITIES: readonly Availability[] = ['in-stock', 'made-to-order'];
const SORT_ORDERS: readonly SortOrder[] = ['name', 'price-asc', 'price-desc'];

export type FilterKey = 'category' | 'brand' | 'availability' | 'condition' | 'sold' | 'search' | 'sort';
export type FilterPatch = Partial<Record<FilterKey, string | undefined>>;

function parsePage(raw: string | null): number {
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function parseOneOf<T extends string>(raw: string | null, allowed: readonly T[]): T | undefined {
  return allowed.find((value) => value === raw);
}

export function parseCatalogQuery(params: URLSearchParams, locale: Locale): CatalogQuery {
  return {
    categorySlug: params.get('category') || undefined,
    brandSlug: params.get('brand') || undefined,
    availability: parseOneOf(params.get('availability'), AVAILABILITIES),
    condition: parseOneOf<ProductCondition>(params.get('condition'), PRODUCT_CONDITIONS),
    includeSold: params.get('sold') === '1' ? true : undefined,
    search: params.get('search') || undefined,
    sort: parseOneOf(params.get('sort'), SORT_ORDERS),
    page: parsePage(params.get('page')),
    pageSize: PAGE_SIZE,
    locale,
  };
}

export function applyFilterPatch(params: URLSearchParams, patch: FilterPatch): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(patch)) {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  }
  next.delete('page');
  return next;
}

export function toApiQueryString(query: CatalogQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const serialised = params.toString();
  return serialised ? `?${serialised}` : '';
}
