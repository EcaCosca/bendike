import type { TranslationOverrides } from './catalog';
import type { LocalizedText } from './locale';
import type { PriceCurrency } from './pricing';

export const SERVICE_CATEGORIES = ['repack', 'aad_service', 'repair', 'reline', 'other'] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export function isServiceCategory(value: unknown): value is ServiceCategory {
  return typeof value === 'string' && (SERVICE_CATEGORIES as readonly string[]).includes(value);
}

export interface ServiceSummary {
  id: string;
  slug: string;
  category: ServiceCategory;
  name: LocalizedText;
  summary: LocalizedText;
  priceAmount: number | null;
  priceCurrency: PriceCurrency | null;
  position: number;
  active: boolean;
}

export interface ServiceDetail extends ServiceSummary {
  descriptionMd: LocalizedText;
  turnaroundNote: LocalizedText | null;
}

export interface ServiceAdminDetail extends ServiceDetail {
  translationOverrides: TranslationOverrides;
}

export const SERVICE_COPY_FIELDS = ['name', 'summary', 'descriptionMd', 'turnaroundNote'] as const;

export type ServiceCopyField = (typeof SERVICE_COPY_FIELDS)[number];

export interface CreateServiceRequestBody {
  slug: string;
  category: ServiceCategory;
  name: string;
  summary: string;
  descriptionMd: string;
  turnaroundNote?: string;
  priceAmount?: number | null;
  priceCurrency?: PriceCurrency | null;
  position?: number;
}

export interface UpdateServiceRequestBody {
  category?: ServiceCategory;
  priceAmount?: number | null;
  priceCurrency?: PriceCurrency | null;
  position?: number;
  active?: boolean;
}

export interface UpdateServiceCopyRequestBody {
  field: ServiceCopyField;
  locale: keyof LocalizedText;
  value: string;
}
