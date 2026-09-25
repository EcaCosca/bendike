import 'reflect-metadata';
import fs from 'node:fs';
import path from 'node:path';
import type { LocalizedText } from '@bendike/shared';
import { Product } from '../src/catalog/entities/product.entity';
import dataSource from '../src/database/data-source';
import { LearnCollection } from '../src/learn/entities/learn-collection.entity';
import { LearnItem } from '../src/learn/entities/learn-item.entity';

/**
 * Writes the translation worksheets Eca fills in by hand.
 *
 * One Markdown file per locale, because the product descriptions are Markdown and
 * nobody should have to write 1,600 characters of it inside a JSON string with
 * escaped newlines. The English sits in a comment directly above each blank, so the
 * file is the only thing open while translating.
 *
 * Re-running keeps every translation already written and only adds what is new, so
 * this is safe to run again after the catalogue grows.
 *
 *   npm run translations:export -w @bendike/api
 */

const OUT = path.join(__dirname, 'translations');
const LOCALES = ['es', 'pt'] as const;
type Locale = (typeof LOCALES)[number];

const LOCALE_NAMES: Record<Locale, string> = { es: 'Spanish', pt: 'Portuguese (Brazil)' };

interface Entry {
  key: string;
  field: string;
  english: string;
  label: string;
}

const HEADER = (locale: Locale, group: string, count: number) => `<!--
${group} — ${LOCALE_NAMES[locale]}

Write your translation in the blank space under each heading. The English is in the
comment above it. Leave a section empty and the importer skips it, so you can stop
and come back; run \`npm run translations:progress -w @bendike/api\` to see how many
are left.

Each section starts with a hidden marker comment naming the record and the field.
Leave those alone — they are how the importer finds your work. Write below each one.
Product names and video titles are not in here on purpose: "Hayduke 2" is a name,
and a Squirrel TV title names an English video.

${count} sections to fill.
-->

`;

/**
 * The section marker is an HTML comment, not a Markdown heading. Product descriptions
 * are Markdown and contain their own `## Features` and `## Materials`, so splitting on
 * `## ` cut the English reference blocks in half and read the leftover English as a
 * finished translation. A comment marker cannot collide with the content.
 */
const MARKER = /<!--# (.+?) #-->/g;

function section(entry: Entry, existing: string): string {
  return [
    `<!--# ${entry.key} · ${entry.field} #-->`,
    `<!-- ${entry.label} -->`,
    '<!--EN',
    entry.english,
    'EN-->',
    '',
    existing,
    '',
  ].join('\n');
}

export function countSections(text: string): number {
  return [...text.matchAll(MARKER)].length;
}

/** Reads what is already written so an export never destroys work in progress. */
export function parseWorksheet(text: string): Map<string, string> {
  const written = new Map<string, string>();
  const markers = [...text.matchAll(MARKER)];
  for (const [index, marker] of markers.entries()) {
    const heading = (marker[1] ?? '').trim();
    const start = (marker.index ?? 0) + marker[0].length;
    const end = markers[index + 1]?.index ?? text.length;
    const body = text
      .slice(start, end)
      .replace(/<!--EN[\s\S]*?EN-->/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
    if (body) {
      written.set(heading, body);
    }
  }
  return written;
}

function localized(text: LocalizedText): string {
  return text.en ?? '';
}

async function main(): Promise<void> {
  await dataSource.initialize();
  fs.mkdirSync(OUT, { recursive: true });

  const products = await dataSource.getRepository(Product).find({ order: { slug: 'ASC' } });
  const items = await dataSource.getRepository(LearnItem).find({ order: { slug: 'ASC' } });
  const collections = await dataSource.getRepository(LearnCollection).find({ order: { slug: 'ASC' } });

  const groups: Record<string, Entry[]> = {
    products: products.flatMap((product) =>
      (['summary', 'descriptionMd'] as const)
        .filter((field) => localized(product[field]).trim())
        .map((field) => ({
          key: product.slug,
          field,
          english: localized(product[field]),
          label: product.name.en,
        })),
    ),
    learn: [
      ...items
        .filter((item) => localized(item.summary).trim())
        .map((item) => ({
          key: item.slug,
          field: 'summary',
          english: localized(item.summary),
          label: item.title.en,
        })),
      ...collections.flatMap((collection) =>
        (['title', 'intro'] as const).map((field) => ({
          key: collection.slug,
          field,
          english: localized(collection[field]),
          label: `shelf: ${collection.slug}`,
        })),
      ),
    ],
  };

  for (const [group, entries] of Object.entries(groups)) {
    for (const locale of LOCALES) {
      const file = path.join(OUT, `${group}.${locale}.md`);
      const existing = fs.existsSync(file) ? parseWorksheet(fs.readFileSync(file, 'utf-8')) : new Map<string, string>();
      const body = entries
        .map((entry) => section(entry, existing.get(`${entry.key} · ${entry.field}`) ?? ''))
        .join('\n');
      fs.writeFileSync(file, HEADER(locale, group, entries.length) + body);
      const done = entries.filter((entry) => existing.has(`${entry.key} · ${entry.field}`)).length;
      const chars = entries.reduce((total, entry) => total + entry.english.length, 0);
      console.log(
        `  ${path.relative(process.cwd(), file).padEnd(46)} ${String(done).padStart(3)}/${entries.length} done · ${chars.toLocaleString()} chars of English`,
      );
    }
  }

  await dataSource.destroy();
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
