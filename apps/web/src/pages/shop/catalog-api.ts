import type {
  Brand,
  CatalogQuery,
  Category,
  ExchangeRates,
  Page,
  ProductDetail,
  ProductSummary,
} from '@bendike/shared';
import { apiFetch } from '../../api/http';
import { toApiQueryString } from './catalog-query';

export function listProducts(query: CatalogQuery): Promise<Page<ProductSummary>> {
  return apiFetch<Page<ProductSummary>>(`/catalog/products${toApiQueryString(query)}`);
}

export function getProduct(slug: string): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/catalog/products/${encodeURIComponent(slug)}`);
}

export function listCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/catalog/categories');
}

export function listBrands(): Promise<Brand[]> {
  return apiFetch<Brand[]>('/catalog/brands');
}

export function getExchangeRates(): Promise<ExchangeRates> {
  return apiFetch<ExchangeRates>('/exchange-rates');
}
