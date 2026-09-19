import { Injectable } from '@nestjs/common';
import type { TranslationOverrides } from '@bendike/shared';
import { HttpDeepLClient } from './deepl-client';
import type { DeepLClient } from './deepl-client';

export interface FieldTranslation {
  es: string | null;
  pt: string | null;
}

async function translateOrNull(client: DeepLClient, text: string, locale: 'es' | 'pt'): Promise<string | null> {
  try {
    return await client.translate(text, locale);
  } catch {
    return null;
  }
}

export async function translateField(client: DeepLClient, text: string): Promise<FieldTranslation> {
  const [es, pt] = await Promise.all([translateOrNull(client, text, 'es'), translateOrNull(client, text, 'pt')]);

  return { es, pt };
}

export type ProductCopyField = 'name' | 'summary' | 'descriptionMd';

export type EnglishProductCopy = Record<ProductCopyField, string>;
export type ProductCopyTranslations = Record<ProductCopyField, FieldTranslation>;

const PRODUCT_COPY_FIELDS: ProductCopyField[] = ['name', 'summary', 'descriptionMd'];

export async function translateProductCopy(
  client: DeepLClient,
  english: EnglishProductCopy,
  overrides: TranslationOverrides,
): Promise<ProductCopyTranslations> {
  const entries = await Promise.all(
    PRODUCT_COPY_FIELDS.map(async (field) => {
      const text = english[field];
      const es = overrides.es?.includes(field) ? null : await translateOrNull(client, text, 'es');
      const pt = overrides.pt?.includes(field) ? null : await translateOrNull(client, text, 'pt');

      return [field, { es, pt }] as const;
    }),
  );

  return Object.fromEntries(entries) as ProductCopyTranslations;
}

@Injectable()
export class TranslationService {
  constructor(private readonly client: HttpDeepLClient) {}

  translateField(text: string): Promise<FieldTranslation> {
    return translateField(this.client, text);
  }

  translateProductCopy(english: EnglishProductCopy, overrides: TranslationOverrides): Promise<ProductCopyTranslations> {
    return translateProductCopy(this.client, english, overrides);
  }
}
