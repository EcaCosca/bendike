import 'reflect-metadata';
import fs from 'node:fs';
import path from 'node:path';
import { Product } from '../src/catalog/entities/product.entity';
import dataSource from '../src/database/data-source';
import { LearnCollection } from '../src/learn/entities/learn-collection.entity';
import { LearnItem } from '../src/learn/entities/learn-item.entity';
import { parseWorksheet } from './translations-export';

/**
 * Loads the hand-written worksheets back into the database.
 *
 * Anything written here is a human's work, so each imported field is recorded in
 * `translation_overrides`. That is what stops a later machine pass — or a re-import
 * from squirrel.ws — from quietly overwriting it.
 *
 *   npm run translations:import -w @bendike/api -- --dry-run
 *   npm run translations:import -w @bendike/api
 */

const DIR = path.join(__dirname, 'translations');
const LOCALES = ['es', 'pt'] as const;
type Locale = (typeof LOCALES)[number];

const dryRun = process.argv.includes('--dry-run');

function read(group: string, locale: Locale): Map<string, string> {
  const file = path.join(DIR, `${group}.${locale}.md`);
  if (!fs.existsSync(file)) {
    console.warn(`  no worksheet at ${path.relative(process.cwd(), file)} — run translations:export first`);
    return new Map();
  }
  return parseWorksheet(fs.readFileSync(file, 'utf-8'));
}

/** Records that a person owns this field, so nothing automated overwrites it later. */
function markOwned(overrides: Record<string, string[] | undefined>, locale: Locale, field: string): void {
  const owned = overrides[locale] ?? [];
  if (!owned.includes(field)) {
    overrides[locale] = [...owned, field];
  }
}

async function main(): Promise<void> {
  await dataSource.initialize();

  const products = await dataSource.getRepository(Product).find();
  const items = await dataSource.getRepository(LearnItem).find();
  const collections = await dataSource.getRepository(LearnCollection).find();

  const bySlug = {
    product: new Map(products.map((row) => [row.slug, row])),
    item: new Map(items.map((row) => [row.slug, row])),
    collection: new Map(collections.map((row) => [row.slug, row])),
  };

  let applied = 0;
  const unknown: string[] = [];

  for (const group of ['products', 'learn'] as const) {
    for (const locale of LOCALES) {
      for (const [heading, translation] of read(group, locale)) {
        const [key, field] = heading.split(' · ');
        if (!key || !field) {
          unknown.push(`${group}.${locale}: unreadable heading "${heading}"`);
          continue;
        }

        const product = bySlug.product.get(key);
        const item = bySlug.item.get(key);
        const collection = bySlug.collection.get(key);

        if (product && (field === 'summary' || field === 'descriptionMd')) {
          product[field][locale] = translation;
          markOwned(product.translationOverrides, locale, field);
        } else if (item && field === 'summary') {
          item.summary[locale] = translation;
          markOwned(item.translationOverrides, locale, field);
        } else if (collection && (field === 'title' || field === 'intro')) {
          collection[field][locale] = translation;
        } else {
          unknown.push(`${group}.${locale}: nothing matches "${key} · ${field}"`);
          continue;
        }
        applied += 1;
      }
    }
  }

  console.log(`\n${applied} translated field(s) ready to write.`);
  if (unknown.length > 0) {
    console.log(`\n${unknown.length} heading(s) matched nothing — a typo, or the record was renamed:`);
    for (const line of unknown) {
      console.log(`  ${line}`);
    }
  }

  if (dryRun) {
    console.log('\nDry run: nothing written.');
  } else {
    await dataSource.getRepository(Product).save(products);
    await dataSource.getRepository(LearnItem).save(items);
    await dataSource.getRepository(LearnCollection).save(collections);
    console.log('Written, and every imported field marked as yours so nothing overwrites it.');
  }

  await dataSource.destroy();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
