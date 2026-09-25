import 'reflect-metadata';
import fs from 'node:fs';
import path from 'node:path';
import type { LearnLevel, LearnTopic, LocalizedText } from '@bendike/shared';
import { parseEmbed, youtubeThumbnail } from '@bendike/shared';
import { Product } from '../src/catalog/entities/product.entity';
import dataSource from '../src/database/data-source';
import { LearnCollection, LearnCollectionItem } from '../src/learn/entities/learn-collection.entity';
import { LearnItemLink } from '../src/learn/entities/learn-item-link.entity';
import { LearnItem } from '../src/learn/entities/learn-item.entity';

/**
 * Turns Eca's triage of the Squirrel TV channel into learn items, product links
 * and collections. Idempotent: everything is keyed by slug, and links and
 * collection membership are replaced rather than appended, so a re-run after an
 * edit to the triage file converges instead of accumulating.
 *
 * Videos marked promo that name no product come in with format 'film'. They are
 * learn items so they stay editable in admin, but format is the axis that says
 * what a thing is, and a season reel is not material anyone learns from — so the
 * Learn page neither lists them nor offers them as a filter, and they surface
 * only through GET /learn/films, for the landing carousel.
 */

const CATALOG = path.join(__dirname, 'squirrel-tv-catalog.json');
const SUMMARIES = path.join(__dirname, 'squirrel-tv-summaries.json');
const SOURCE_NAME = 'Squirrel TV';

interface CatalogEntry {
  id: string;
  title: string;
  url: string;
  duration: string;
  seconds: number;
  thumbnail: string | null;
  learnSection: string | null;
  promo: boolean;
  families: string[];
  products: string[];
}

/** The shelf each Learn section becomes, and the topic that shelf sits under. */
const SECTIONS: Record<string, { slug: string; title: string; intro: string; topic: LearnTopic; level: LearnLevel }> = {
  'technique-safety': {
    slug: 'sqtv-technique-and-safety',
    title: 'Technique and safety',
    intro:
      'Flying, exits and deployments, explained by the people who build the gear and the instructors who teach it. Watching is not training — take a course.',
    topic: 'safety_culture',
    level: 'experienced',
  },
  'packing-rigging': {
    slug: 'sqtv-packing-and-rigging',
    title: 'Packing and rigging',
    intro: 'Pro pack, flat pack, brake stows and pin tension. The jobs you do on the floor before anyone jumps.',
    topic: 'packing',
    level: 'experienced',
  },
  'gear-knowledge': {
    slug: 'sqtv-gear-knowledge',
    title: 'Know your gear',
    intro: 'How the kit is built, how to measure for it, and how to keep it working. Ownership, not shopping.',
    topic: 'gear_care',
    level: 'all',
  },
  'before-you-buy': {
    slug: 'sqtv-before-you-buy',
    title: 'Before you buy',
    intro: 'What a suit or canopy actually does, so the choice is made on flying rather than on a spec sheet.',
    topic: 'first_rig',
    level: 'all',
  },
  reviews: {
    slug: 'sqtv-reviews',
    title: 'Reviews',
    intro: 'Pilots reporting on gear they have put real jumps on.',
    topic: 'reviews',
    level: 'experienced',
  },
};

/** Subject topics a video inherits from the products it is attached to. */
const FAMILY_TOPICS: Record<string, LearnTopic[]> = {
  wingsuits: ['wingsuit'],
  'tracking-suits': ['wingsuit'],
  'wingsuit-accessories': ['wingsuit', 'gear_care'],
  'base-canopies': ['canopy', 'wingsuit_base'],
  'skydiving-canopies': ['canopy'],
  containers: ['wingsuit_base', 'gear_care'],
  'pilot-chutes': ['wingsuit_base', 'gear_care'],
  sliders: ['canopy', 'gear_care'],
  'stash-bags': ['gear_care'],
  'travel-bags': ['gear_care'],
  accessories: ['gear_care'],
  books: ['safety_culture'],
  aad: ['aad'],
  instruments: ['instruments'],
};

/** English in all three locales, with no override recorded, so a later translation run fills es and pt. */
const untranslated = (text: string): LocalizedText => ({ en: text, es: text, pt: text });

function topicsFor(entry: CatalogEntry): LearnTopic[] {
  const topics = new Set<LearnTopic>();
  const section = entry.learnSection ? SECTIONS[entry.learnSection] : undefined;
  if (section) {
    topics.add(section.topic);
  }
  for (const family of entry.families) {
    for (const topic of FAMILY_TOPICS[family] ?? []) {
      topics.add(topic);
    }
  }
  return [...topics];
}

async function resolveProductIds(slugs: string[]): Promise<Map<string, string>> {
  const products = await dataSource.getRepository(Product).find();
  const bySlug = new Map(products.map((product) => [product.slug, product.id]));
  const missing = slugs.filter((slug) => !bySlug.has(slug));
  if (missing.length > 0) {
    console.warn(`No product for ${missing.length} slug(s); their links are skipped: ${missing.join(', ')}`);
  }
  return bySlug;
}

async function upsertItem(entry: CatalogEntry, summary: string): Promise<LearnItem> {
  const items = dataSource.getRepository(LearnItem);
  const slug = `sqtv-${entry.id}`;
  const embed = parseEmbed(entry.url);
  if (!embed) {
    throw new Error(`Could not parse an embed out of ${entry.url} (${entry.title})`);
  }
  const section = entry.learnSection ? SECTIONS[entry.learnSection] : undefined;
  const isFilm = entry.learnSection === null && entry.products.length === 0;
  const fields = {
    format: isFilm ? ('film' as const) : ('video' as const),
    title: untranslated(entry.title),
    summary: untranslated(summary),
    author: null,
    sourceName: SOURCE_NAME,
    url: entry.url,
    embedProvider: embed.provider,
    embedId: embed.id,
    embedKind: embed.kind,
    thumbnailUrl: entry.thumbnail ?? youtubeThumbnail(embed.id),
    contentLanguage: 'en' as const,
    topics: topicsFor(entry),
    level: section?.level ?? 'all',
    durationMinutes: Math.max(1, Math.ceil(entry.seconds / 60)),
    publishedAt: null,
    buyUrl: null,
    affiliate: false,
    active: true,
  };

  const existing = await items.findOne({ where: { slug } });
  if (existing) {
    Object.assign(existing, fields);
    return items.save(existing);
  }
  return items.save(items.create({ slug, translationOverrides: {}, position: 0, createdBy: null, ...fields }));
}

/**
 * `LearnService.linked` sorts a product's videos by `link.position`, so position
 * means "where this video sits on THAT product's page" — it is a property of the
 * pairing, not of the video. Hence one pass per product rather than per video:
 * numbering links in the order a video happens to list its products would put a
 * forty-second clip above a four-minute explainer.
 */
async function writeProductLinks(byProduct: Map<string, { itemId: string; seconds: number }[]>): Promise<number> {
  const links = dataSource.getRepository(LearnItemLink);
  let written = 0;
  for (const [targetId, videos] of byProduct) {
    const ordered = [...videos].sort((a, b) => b.seconds - a.seconds);
    for (const [position, video] of ordered.entries()) {
      await links.save(links.create({ itemId: video.itemId, targetKind: 'product', targetId, position }));
      written += 1;
    }
  }
  return written;
}

async function upsertCollection(section: (typeof SECTIONS)[string], itemIds: string[]): Promise<void> {
  const collections = dataSource.getRepository(LearnCollection);
  const members = dataSource.getRepository(LearnCollectionItem);
  const fields = {
    title: untranslated(section.title),
    intro: untranslated(section.intro),
    topic: section.topic,
    startHere: false,
    active: true,
  };

  let collection = await collections.findOne({ where: { slug: section.slug } });
  if (collection) {
    Object.assign(collection, fields);
    collection = await collections.save(collection);
  } else {
    collection = await collections.save(collections.create({ slug: section.slug, ...fields }));
  }

  await members.delete({ collectionId: collection.id });
  for (const [position, itemId] of itemIds.entries()) {
    await members.save(members.create({ collectionId: collection.id, itemId, position }));
  }
}

async function main(): Promise<void> {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf-8')) as CatalogEntry[];
  const summaries = (JSON.parse(fs.readFileSync(SUMMARIES, 'utf-8')) as { summaries: Record<string, string> })
    .summaries;

  // Everything kept becomes a learn item; format decides whether it teaches or sells.
  const importable = catalog;
  const written = new Map<string, string>();
  const unwritten: CatalogEntry[] = [];
  for (const entry of importable) {
    const summary = summaries[entry.id]?.trim();
    if (summary) {
      written.set(entry.id, summary);
    } else {
      unwritten.push(entry);
    }
  }
  if (unwritten.length > 0) {
    throw new Error(
      `No Bendike summary for ${unwritten.length} video(s). Write them in squirrel-tv-summaries.json before seeding:\n` +
        unwritten.map((entry) => `  ${entry.id}  ${entry.title}`).join('\n'),
    );
  }

  await dataSource.initialize();
  const bySlug = await resolveProductIds([...new Set(importable.flatMap((entry) => entry.products))]);

  const idsBySection = new Map<string, { itemId: string; seconds: number }[]>();
  const byProduct = new Map<string, { itemId: string; seconds: number }[]>();
  const links = dataSource.getRepository(LearnItemLink);
  for (const entry of importable) {
    const item = await upsertItem(entry, written.get(entry.id) ?? '');
    // Clear first, write below, so a video dropped from the triage file loses its links.
    await links.delete({ itemId: item.id, targetKind: 'product' });
    for (const slug of entry.products) {
      const productId = bySlug.get(slug);
      if (!productId) {
        continue;
      }
      byProduct.set(productId, [...(byProduct.get(productId) ?? []), { itemId: item.id, seconds: entry.seconds }]);
    }
    if (entry.learnSection) {
      idsBySection.set(entry.learnSection, [
        ...(idsBySection.get(entry.learnSection) ?? []),
        { itemId: item.id, seconds: entry.seconds },
      ]);
    }
  }
  const linkCount = await writeProductLinks(byProduct);

  for (const [key, section] of Object.entries(SECTIONS)) {
    // Longest first: the thorough ones earn the top of the shelf.
    const ordered = (idsBySection.get(key) ?? []).sort((a, b) => b.seconds - a.seconds).map((row) => row.itemId);
    await upsertCollection(section, ordered);
    console.log(`  ${section.slug.padEnd(28)} ${String(ordered.length).padStart(3)} videos`);
  }

  const films = catalog.filter((entry) => entry.learnSection === null && entry.products.length === 0).length;
  console.log(
    `Seeded ${importable.length} learn items, ${linkCount} product links, ${Object.keys(SECTIONS).length} collections.`,
  );
  console.log(`${films} of those are films, served only to the landing carousel.`);
  await dataSource.destroy();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
