import type { Locale, LocalizedText } from './locale';
import type { Currency, PriceCurrency } from './pricing';

export interface Brand {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  active: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  parentId: string | null;
  position: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  optionNames: string[];
  optionValues: string[];
  listPriceUsd: number | null;
  active: boolean;
}

export const PRODUCT_CONDITIONS = ['new', 'used'] as const;

export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export type TranslationOverrides = Partial<Record<Locale, string[]>>;

export interface ProductSummary {
  id: string;
  slug: string;
  brand: Brand;
  categoryId: string;
  name: LocalizedText;
  summary: LocalizedText;
  listPriceUsd: number | null;
  markupPercent: number;
  condition: ProductCondition;
  priceAmount: number | null;
  priceCurrency: PriceCurrency | null;
  sold: boolean;
  madeToOrder: boolean;
  active: boolean;
  primaryImage: ProductImage | null;
}

export interface ProductDetail extends ProductSummary {
  descriptionMd: LocalizedText;
  variants: ProductVariant[];
  images: ProductImage[];
}

export type Availability = 'in-stock' | 'made-to-order';
export type SortOrder = 'name' | 'price-asc' | 'price-desc';

export interface CatalogQuery {
  categorySlug?: string;
  brandSlug?: string;
  availability?: Availability;
  condition?: ProductCondition;
  includeSold?: boolean;
  search?: string;
  sort?: SortOrder;
  page?: number;
  pageSize?: number;
  locale?: Locale;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ExchangeRate {
  currency: Currency;
  usdRate: number;
  source: string;
  fetchedAt: string;
  manualOverride: boolean;
}

export type ExchangeRates = Record<Exclude<Currency, 'USD'>, ExchangeRate>;

export interface UsedItemAdminDetail extends ProductDetail {
  translationOverrides: TranslationOverrides;
  soldAt: string | null;
}

export interface CreateUsedItemRequestBody {
  name: string;
  summary: string;
  descriptionMd: string;
  brandId: string;
  categoryId: string;
  priceAmount: number;
  priceCurrency: PriceCurrency;
}

export interface UpdateUsedItemRequestBody {
  brandId?: string;
  categoryId?: string;
  priceAmount?: number;
  priceCurrency?: PriceCurrency;
  active?: boolean;
  sold?: boolean;
}

export interface CreateBrandRequestBody {
  slug: string;
  name: string;
  websiteUrl?: string;
}
