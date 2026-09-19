import 'reflect-metadata';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium } from 'playwright';
import type { LocalizedText } from '@bendike/shared';
import { slugify } from '@bendike/shared';
import { Brand } from '../src/catalog/entities/brand.entity';
import { Category } from '../src/catalog/entities/category.entity';
import { ProductImage } from '../src/catalog/entities/product-image.entity';
import { ProductVariant } from '../src/catalog/entities/product-variant.entity';
import { Product } from '../src/catalog/entities/product.entity';
import dataSource from '../src/database/data-source';
import {
  normalizeSquirrelProduct,
  type NormalizedSquirrelProduct,
  type SquirrelPageData,
} from '../src/catalog/squirrel-normalizer';
import { HttpDeepLClient } from '../src/translation/deepl-client';
import { TranslationService, type ProductCopyField } from '../src/translation/translation.service';
import type { AppConfigService } from '../src/config/app.config.service';

interface SeedEntry {
  name: string;
  category: string;
  sizes: string | string[];
  link: string;
}

interface CategoryMapping {
  slug: string;
  position: number;
  name: LocalizedText;
}

const CACHE_DIR = path.join(__dirname, '.squirrel-cache');
const FETCH_DELAY_MS = 1000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
const COPY_FIELDS: ProductCopyField[] = ['name', 'summary', 'descriptionMd'];

const CATEGORY_MAPPINGS: Record<string, CategoryMapping> = {
  Wingsuit: { slug: 'wingsuits', position: 0, name: { en: 'Wingsuits', es: 'Trajes de alas', pt: 'Wingsuits' } },
  'Tracking Suit': {
    slug: 'tracking-suits',
    position: 1,
    name: { en: 'Tracking Suits', es: 'Trajes de tracking', pt: 'Roupas de tracking' },
  },
  'BASE Canopy': {
    slug: 'base-canopies',
    position: 2,
    name: { en: 'BASE Canopies', es: 'Paracaídas de BASE', pt: 'Paraquedas de BASE' },
  },
  'Skydiving Canopy': {
    slug: 'skydiving-canopies',
    position: 3,
    name: { en: 'Skydiving Canopies', es: 'Paracaídas de paracaidismo', pt: 'Paraquedas de paraquedismo' },
  },
  Container: { slug: 'containers', position: 4, name: { en: 'Containers', es: 'Contenedores', pt: 'Containers' } },
  'Pilot Chute': { slug: 'pilot-chutes', position: 5, name: { en: 'Pilot Chutes', es: 'Pilotos', pt: 'Pilot chutes' } },
  'Stash Bag': { slug: 'stash-bags', position: 6, name: { en: 'Stash Bags', es: 'Bolsas stash', pt: 'Sacos stash' } },
  Accessory: { slug: 'accessories', position: 8, name: { en: 'Accessories', es: 'Accesorios', pt: 'Acessórios' } },
  Slider: { slug: 'sliders', position: 7, name: { en: 'Sliders', es: 'Sliders', pt: 'Sliders' } },
  'Travel Bag': {
    slug: 'travel-bags',
    position: 10,
    name: { en: 'Travel Bags', es: 'Bolsos de viaje', pt: 'Bolsas de viagem' },
  },
  Book: { slug: 'books', position: 11, name: { en: 'Books', es: 'Libros', pt: 'Livros' } },
  'Wingsuit Accessory': {
    slug: 'wingsuit-accessories',
    position: 9,
    name: { en: 'Wingsuit Accessories', es: 'Accesorios de wingsuit', pt: 'Acessórios de wingsuit' },
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPageData(
  page: import('playwright').Page,
  url: string,
  cacheKey: string,
): Promise<SquirrelPageData> {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8')) as SquirrelPageData;
  }

  let captured: string | null = null;
  const onResponse = async (response: import('playwright').Response): Promise<void> => {
    if (!captured && response.url().includes('/page-data/') && response.url().endsWith('page-data.json')) {
      try {
        captured = await response.text();
      } catch {
        // response body unavailable (e.g. redirect); keep waiting for the real one
      }
    }
  };
  page.on('response', onResponse);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  page.off('response', onResponse);

  if (!captured) {
    throw new Error(`Did not capture page-data.json while loading ${url}`);
  }

  fs.writeFileSync(cachePath, captured);
  return JSON.parse(captured) as SquirrelPageData;
}

async function resolveCategoryId(categoryName: string): Promise<string> {
  const mapping = CATEGORY_MAPPINGS[categoryName];
  if (!mapping) {
    throw new Error(`No category mapping for Squirrel category "${categoryName}"`);
  }
  const categories = dataSource.getRepository(Category);
  const existing = await categories.findOne({ where: { slug: mapping.slug } });
  if (existing) {
    return existing.id;
  }
  const created = await categories.save(
    categories.create({ slug: mapping.slug, name: mapping.name, parentId: null, position: mapping.position }),
  );
  return created.id;
}

async function syncProductCopy(
  product: Product,
  normalized: NormalizedSquirrelProduct,
  translation: TranslationService,
  isNew: boolean,
): Promise<void> {
  const newEnglish: Record<ProductCopyField, string> = {
    name: normalized.name,
    summary: normalized.summary,
    descriptionMd: normalized.descriptionMd,
  };

  const changedFields = COPY_FIELDS.filter((field) => {
    if (isNew) {
      return true;
    }
    const overriddenEn = product.translationOverrides.en?.includes(field) ?? false;
    return !overriddenEn && product[field].en !== newEnglish[field];
  });

  if (changedFields.length === 0) {
    return;
  }

  for (const field of changedFields) {
    product[field] = { ...product[field], en: newEnglish[field] };
  }

  const translations = await translation.translateProductCopy(newEnglish, product.translationOverrides);
  for (const field of changedFields) {
    const { es, pt } = translations[field];
    product[field] = {
      en: newEnglish[field],
      es: es ?? product[field].es,
      pt: pt ?? product[field].pt,
    };
  }
}

async function upsertProduct(
  brandId: string,
  seedEntry: SeedEntry,
  normalized: NormalizedSquirrelProduct,
  translation: TranslationService,
): Promise<Product> {
  const products = dataSource.getRepository(Product);
  const categoryId = await resolveCategoryId(seedEntry.category);

  let product = await products.findOne({ where: { sourceRef: normalized.sourceRef } });
  const isNew = !product;

  if (!product) {
    const englishUntilTranslated = (text: string): LocalizedText => ({ en: text, es: text, pt: text });
    product = products.create({
      slug: slugify(seedEntry.name),
      brandId,
      categoryId,
      name: englishUntilTranslated(normalized.name),
      summary: englishUntilTranslated(normalized.summary),
      descriptionMd: englishUntilTranslated(normalized.descriptionMd),
      translationOverrides: {},
      listPriceUsd: String(normalized.priceUsd),
      markupPercent: '20',
      madeToOrder: normalized.madeToOrder,
      source: 'squirrel',
      sourceRef: normalized.sourceRef,
      sourceUrl: seedEntry.link,
      active: true,
    });
  } else {
    product.brandId = brandId;
    product.categoryId = categoryId;
    product.listPriceUsd = String(normalized.priceUsd);
    product.madeToOrder = normalized.madeToOrder;
    product.sourceUrl = seedEntry.link;
  }

  await syncProductCopy(product, normalized, translation, isNew);
  product = await products.save(product);

  const variants = dataSource.getRepository(ProductVariant);
  await variants.delete({ productId: product.id });
  for (const variant of normalized.variants) {
    await variants.save(
      variants.create({
        productId: product.id,
        sku: variant.sku,
        optionNames: variant.optionNames,
        optionValues: variant.optionValues,
        listPriceUsd: variant.priceUsd != null ? String(variant.priceUsd) : null,
        active: true,
      }),
    );
  }

  const images = dataSource.getRepository(ProductImage);
  await images.delete({ productId: product.id });
  for (const [index, url] of normalized.images.entries()) {
    await images.save(images.create({ productId: product.id, url, alt: normalized.name, position: index }));
  }

  return product;
}

async function main(): Promise<void> {
  const seedPath = path.join(__dirname, 'squirrel-catalog-seed.json');
  const seedEntries = JSON.parse(fs.readFileSync(seedPath, 'utf-8')) as SeedEntry[];

  await dataSource.initialize();

  const brands = dataSource.getRepository(Brand);
  let brand = await brands.findOne({ where: { slug: 'squirrel' } });
  brand ??= await brands.save(
    brands.create({ slug: 'squirrel', name: 'Squirrel', websiteUrl: 'https://squirrel.ws', active: true }),
  );

  const configLike = {
    deeplApiKey: process.env.DEEPL_API_KEY,
    deeplApiUrl: process.env.DEEPL_API_URL ?? 'https://api-free.deepl.com',
  } as AppConfigService;
  const translation = new TranslationService(new HttpDeepLClient(configLike));

  const browser = await chromium.launch();
  const page = await browser.newPage({ userAgent: USER_AGENT });

  let count = 0;
  for (const entry of seedEntries) {
    const cacheKey = slugify(entry.name);
    console.log(`[${++count}/${seedEntries.length}] ${entry.name}`);
    const pageData = await fetchPageData(page, entry.link, cacheKey);
    const normalized = normalizeSquirrelProduct(pageData);
    await upsertProduct(brand.id, entry, normalized, translation);
    await sleep(FETCH_DELAY_MS);
  }

  await browser.close();
  await dataSource.destroy();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
