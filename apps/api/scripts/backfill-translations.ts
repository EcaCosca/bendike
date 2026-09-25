import 'reflect-metadata';
import type { LocalizedText, TranslationOverrides } from '@bendike/shared';
import { Product } from '../src/catalog/entities/product.entity';
import dataSource from '../src/database/data-source';
import { LearnCollection } from '../src/learn/entities/learn-collection.entity';
import { LearnItem } from '../src/learn/entities/learn-item.entity';
import { applyGlossary, missingTerms } from '../src/translation/glossary';

/**
 * Fills the Spanish and Portuguese that never got written, because DEEPL_API_KEY was
 * empty and every failure path in the importer falls back to English in silence.
 *
 * Translates, then corrects the gear vocabulary with the glossary, then reports every
 * field it touched. It cannot fix agreement around a replaced word, so the report is
 * the point: a native speaker reads it afterwards.
 *
 *   npm run translate:backfill -w @bendike/api -- --dry-run
 *   npm run translate:backfill -w @bendike/api
 *
 * Names are never translated. "Hayduke 2" and "Freak 6" are products, and a Squirrel TV
 * title names an English video — translating either would misdescribe the thing.
 */

const DEEPL_URL = process.env.DEEPL_API_URL ?? 'https://api-free.deepl.com';
const DEEPL_KEY = process.env.DEEPL_API_KEY ?? '';
const TARGET: Record<Locale, string> = { es: 'ES', pt: 'PT-BR' };
const LOCALES: Locale[] = ['es', 'pt'];

type Locale = 'es' | 'pt';

interface Job {
  kind: string;
  id: string;
  label: string;
  field: string;
  english: string;
  apply: (locale: Locale, value: string) => void;
}

const dryRun = process.argv.includes('--dry-run');

async function translate(text: string, locale: Locale): Promise<string | null> {
  const response = await fetch(`${DEEPL_URL}/v2/translate`, {
    method: 'POST',
    headers: { Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: [text], target_lang: TARGET[locale] }),
  });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as { translations?: Array<{ text: string }> };
  return body.translations?.[0]?.text ?? null;
}

/** A field wants translating when nobody has claimed it and it still reads as the English. */
function needs(text: LocalizedText, overrides: TranslationOverrides, field: string, locale: Locale): boolean {
  if (overrides[locale]?.includes(field)) {
    return false;
  }
  const value = text[locale];
  return !value?.trim() || value === text.en;
}

function collect(
  kind: string,
  id: string,
  label: string,
  field: string,
  text: LocalizedText,
  overrides: TranslationOverrides,
): Job | null {
  if (!text.en?.trim()) {
    return null;
  }
  if (!LOCALES.some((locale) => needs(text, overrides, field, locale))) {
    return null;
  }
  return {
    kind,
    id,
    label,
    field,
    english: text.en,
    apply: (locale, value) => {
      if (needs(text, overrides, field, locale)) {
        text[locale] = value;
      }
    },
  };
}

interface Gathered {
  jobs: Job[];
  /** The very objects the jobs mutate. Re-fetching to save would discard every change. */
  products: Product[];
  items: LearnItem[];
  collections: LearnCollection[];
}

async function gather(): Promise<Gathered> {
  const jobs: Job[] = [];
  const products = await dataSource.getRepository(Product).find();
  const items = await dataSource.getRepository(LearnItem).find();
  const collections = await dataSource.getRepository(LearnCollection).find();

  for (const product of products) {
    const label = product.name.en;
    for (const field of ['summary', 'descriptionMd'] as const) {
      const job = collect('product', product.id, label, field, product[field], product.translationOverrides);
      if (job) {
        jobs.push(job);
      }
    }
  }

  for (const item of items) {
    const job = collect('learn item', item.id, item.title.en, 'summary', item.summary, item.translationOverrides);
    if (job) {
      jobs.push(job);
    }
  }

  for (const collection of collections) {
    for (const field of ['title', 'intro'] as const) {
      const job = collect('collection', collection.id, collection.slug, field, collection[field], {});
      if (job) {
        jobs.push(job);
      }
    }
  }

  return { jobs, products, items, collections };
}

async function main(): Promise<void> {
  if (!dryRun && !DEEPL_KEY) {
    throw new Error(
      'DEEPL_API_KEY is empty. That is the reason nothing has ever been translated: the client returns null ' +
        'without a key and every caller falls back to English. Set it, or pass --dry-run to see the cost first.',
    );
  }

  await dataSource.initialize();
  const { jobs, products, items, collections } = await gather();
  const characters = jobs.reduce((total, job) => total + job.english.length * LOCALES.length, 0);

  console.log(
    `${jobs.length} field(s) need translating, ${characters.toLocaleString()} characters across both locales.`,
  );
  console.log('DeepL free tier allows 500,000 a month.\n');

  if (dryRun) {
    const byKind = new Map<string, number>();
    for (const job of jobs) {
      byKind.set(job.kind, (byKind.get(job.kind) ?? 0) + 1);
    }
    for (const [kind, count] of byKind) {
      console.log(`  ${kind.padEnd(12)} ${String(count).padStart(4)} fields`);
    }
    console.log('\nDry run: nothing written.');
    await dataSource.destroy();
    return;
  }

  const review: string[] = [];
  const failed: string[] = [];
  let done = 0;

  for (const job of jobs) {
    for (const locale of LOCALES) {
      const raw = await translate(job.english, locale);
      if (raw === null) {
        failed.push(`${job.kind} ${job.label} · ${job.field} · ${locale}`);
        continue;
      }
      const corrected = applyGlossary(raw, locale);
      job.apply(locale, corrected);
      const missing = missingTerms(job.english, corrected, locale);
      if (missing.length > 0) {
        review.push(`${job.kind} ${job.label} · ${job.field} · ${locale} · check: ${missing.join(', ')}`);
      }
    }
    done += 1;
    if (done % 25 === 0) {
      console.log(`  ${done}/${jobs.length}`);
    }
  }

  // These are the objects the jobs mutated. Saving a fresh read would write back the
  // untouched English and lose the whole run.
  await dataSource.getRepository(Product).save(products);
  await dataSource.getRepository(LearnItem).save(items);
  await dataSource.getRepository(LearnCollection).save(collections);

  console.log(`\nTranslated ${jobs.length - failed.length} of ${jobs.length} fields.`);
  if (failed.length > 0) {
    console.log(`\n${failed.length} left in English because DeepL returned nothing:`);
    for (const line of failed) {
      console.log(`  ${line}`);
    }
  }
  if (review.length > 0) {
    console.log(`\n${review.length} worth a native speaker's eye — a gear term did not survive the trip:`);
    for (const line of review) {
      console.log(`  ${line}`);
    }
  }
  await dataSource.destroy();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
