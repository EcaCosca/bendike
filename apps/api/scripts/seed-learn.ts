import 'reflect-metadata';
import type { ContentLanguage, LearnFormat, LearnLevel, LearnTopic, LocalizedText } from '@bendike/shared';
import { parseEmbed, youtubeThumbnail } from '@bendike/shared';
import { Brand } from '../src/catalog/entities/brand.entity';
import dataSource from '../src/database/data-source';
import { LearnItemLink } from '../src/learn/entities/learn-item-link.entity';
import { LearnItem } from '../src/learn/entities/learn-item.entity';

interface SeedItem {
  slug: string;
  format: LearnFormat;
  title: LocalizedText;
  summary: LocalizedText;
  author: string | null;
  sourceName: string;
  url: string;
  contentLanguage: ContentLanguage;
  topics: LearnTopic[];
  level: LearnLevel;
  brandSlug: string | null;
  position: number;
}

const SEED_ITEMS: SeedItem[] = [
  {
    slug: 'squirrel-learn',
    format: 'page',
    title: { en: 'Squirrel Learn', es: 'Squirrel Learn', pt: 'Squirrel Learn' },
    summary: {
      en: "Squirrel's own learning pages: wingsuit progression, sizing, canopy and safety articles from the people who build the suits.",
      es: 'Las páginas de aprendizaje de Squirrel: progresión en wingsuit, talles, velamen y seguridad, escritas por quienes fabrican los trajes.',
      pt: 'As páginas de aprendizado da Squirrel: progressão em wingsuit, tamanhos, velame e segurança, escritas por quem fabrica os trajes.',
    },
    author: null,
    sourceName: 'Squirrel',
    url: 'https://squirrel.ws/learn/',
    contentLanguage: 'en',
    topics: ['wingsuit', 'canopy', 'safety_culture'],
    level: 'all',
    brandSlug: 'squirrel',
    position: 0,
  },
  {
    slug: 'fly-squirrel-tv',
    format: 'channel',
    title: { en: 'Fly Squirrel TV', es: 'Fly Squirrel TV', pt: 'Fly Squirrel TV' },
    summary: {
      en: "Squirrel's YouTube channel: product walkthroughs, flying technique and safety talks.",
      es: 'El canal de YouTube de Squirrel: recorridos de producto, técnica de vuelo y charlas de seguridad.',
      pt: 'O canal de YouTube da Squirrel: apresentações de produto, técnica de voo e conversas sobre segurança.',
    },
    author: null,
    sourceName: 'Squirrel',
    url: 'https://www.youtube.com/@flysquirreltv',
    contentLanguage: 'en',
    topics: ['wingsuit', 'canopy'],
    level: 'all',
    brandSlug: 'squirrel',
    position: 1,
  },
  {
    slug: 'brian-germain',
    format: 'channel',
    title: { en: 'Brian Germain on YouTube', es: 'Brian Germain en YouTube', pt: 'Brian Germain no YouTube' },
    summary: {
      en: 'Canopy flight explained by Brian Germain: turbulence, landings, downsizing and the mental side of the sport.',
      es: 'El vuelo de velamen explicado por Brian Germain: turbulencia, aterrizajes, cambio de tamaño y la parte mental del deporte.',
      pt: 'O voo de velame explicado por Brian Germain: turbulência, pousos, redução de tamanho e o lado mental do esporte.',
    },
    author: 'Brian Germain',
    sourceName: 'Brian Germain',
    url: 'https://www.youtube.com/@Brian-Germain',
    contentLanguage: 'en',
    topics: ['canopy', 'weather', 'safety_culture'],
    level: 'all',
    brandSlug: null,
    position: 2,
  },
  {
    slug: 'the-parachute-and-its-pilot',
    format: 'book',
    title: {
      en: 'The Parachute and its Pilot',
      es: 'The Parachute and its Pilot (El paracaídas y su piloto)',
      pt: 'The Parachute and its Pilot (O paraquedas e seu piloto)',
    },
    summary: {
      en: "Brian Germain's book on ram-air canopy flight. Eca's pick for anyone who wants to understand what the canopy is doing.",
      es: 'El libro de Brian Germain sobre el vuelo de velámenes. La elección de Eca para quien quiera entender qué hace el velamen.',
      pt: 'O livro de Brian Germain sobre o voo de velames. A escolha do Eca para quem quer entender o que o velame está fazendo.',
    },
    author: 'Brian Germain',
    sourceName: 'Big Air Sportz',
    url: 'https://www.bigairsportz.com/',
    contentLanguage: 'en',
    topics: ['canopy', 'safety_culture'],
    level: 'licensed',
    brandSlug: null,
    position: 3,
  },
  {
    slug: 'flysight-gps',
    format: 'channel',
    title: { en: 'FlySight on YouTube', es: 'FlySight en YouTube', pt: 'FlySight no YouTube' },
    summary: {
      en: 'How to set up and read the FlySight GPS: tones, logs and what the numbers say about your flight.',
      es: 'Cómo configurar y leer el GPS FlySight: tonos, registros y qué dicen los números sobre tu vuelo.',
      pt: 'Como configurar e ler o GPS FlySight: tons, registros e o que os números dizem sobre o seu voo.',
    },
    author: null,
    sourceName: 'FlySight',
    url: 'https://www.youtube.com/@flysightgps',
    contentLanguage: 'en',
    topics: ['instruments', 'wingsuit'],
    level: 'all',
    brandSlug: 'flysight',
    position: 4,
  },
  {
    slug: 'vigil-aad',
    format: 'channel',
    title: { en: 'Vigil AAD on YouTube', es: 'Vigil AAD en YouTube', pt: 'Vigil AAD no YouTube' },
    summary: {
      en: "The manufacturer's videos on the Vigil AAD: modes, battery, maintenance and what the display is telling you.",
      es: 'Los videos del fabricante sobre el AAD Vigil: modos, batería, mantenimiento y qué te dice la pantalla.',
      pt: 'Os vídeos do fabricante sobre o AAD Vigil: modos, bateria, manutenção e o que a tela está dizendo.',
    },
    author: null,
    sourceName: 'Vigil',
    url: 'https://www.youtube.com/@vigilaad7736',
    contentLanguage: 'en',
    topics: ['aad', 'gear_care'],
    level: 'all',
    brandSlug: 'vigil',
    position: 5,
  },
  {
    slug: 'exit-point',
    format: 'podcast',
    title: { en: 'Exit Point', es: 'Exit Point', pt: 'Exit Point' },
    summary: {
      en: 'A skydiving podcast Eca follows. Long conversations with people from the sport.',
      es: 'Un podcast de paracaidismo que Eca sigue. Conversaciones largas con gente del deporte.',
      pt: 'Um podcast de paraquedismo que o Eca acompanha. Conversas longas com pessoas do esporte.',
    },
    author: null,
    sourceName: 'Spotify',
    url: 'https://open.spotify.com/show/3WjzoEn19X2rCimimh9C5N',
    contentLanguage: 'en',
    topics: ['safety_culture', 'freefall'],
    level: 'all',
    brandSlug: null,
    position: 6,
  },
  {
    slug: 'leading-edge',
    format: 'podcast',
    title: { en: 'Leading Edge', es: 'Leading Edge', pt: 'Leading Edge' },
    summary: {
      en: 'A skydiving podcast Eca follows. Episodes on Spotify.',
      es: 'Un podcast de paracaidismo que Eca sigue. Episodios en Spotify.',
      pt: 'Um podcast de paraquedismo que o Eca acompanha. Episódios no Spotify.',
    },
    author: null,
    sourceName: 'Spotify',
    url: 'https://open.spotify.com/show/4ZQF3HcHCuChVwZ0nXIJ1J',
    contentLanguage: 'en',
    topics: ['safety_culture', 'canopy'],
    level: 'all',
    brandSlug: null,
    position: 7,
  },
  {
    slug: 'the-20-minute-call',
    format: 'podcast',
    title: { en: 'The 20 Minute Call', es: 'The 20 Minute Call', pt: 'The 20 Minute Call' },
    summary: {
      en: 'A skydiving podcast Eca follows. Episodes on Spotify.',
      es: 'Un podcast de paracaidismo que Eca sigue. Episodios en Spotify.',
      pt: 'Um podcast de paraquedismo que o Eca acompanha. Episódios no Spotify.',
    },
    author: null,
    sourceName: 'Spotify',
    url: 'https://open.spotify.com/show/1Qdkk6ll4T0X8whOyX8xz0',
    contentLanguage: 'en',
    topics: ['safety_culture', 'freefall'],
    level: 'all',
    brandSlug: null,
    position: 8,
  },
  {
    slug: 'the-krav-show',
    format: 'podcast',
    title: { en: 'The Krāv Show', es: 'The Krāv Show', pt: 'The Krāv Show' },
    summary: {
      en: 'A skydiving podcast Eca follows. Episodes on Spotify, with video.',
      es: 'Un podcast de paracaidismo que Eca sigue. Episodios en Spotify, con video.',
      pt: 'Um podcast de paraquedismo que o Eca acompanha. Episódios no Spotify, com vídeo.',
    },
    author: null,
    sourceName: 'Spotify',
    url: 'https://open.spotify.com/show/0IXuGzTeCwtiplzaOZxqti',
    contentLanguage: 'en',
    topics: ['safety_culture', 'wingsuit'],
    level: 'all',
    brandSlug: null,
    position: 9,
  },
];

async function seedItem(seed: SeedItem, brandId: string | null): Promise<void> {
  const items = dataSource.getRepository(LearnItem);
  const links = dataSource.getRepository(LearnItemLink);
  const existing = await items.findOne({ where: { slug: seed.slug } });
  if (existing) {
    return;
  }
  const embed = parseEmbed(seed.url);
  const item = await items.save(
    items.create({
      slug: seed.slug,
      format: seed.format,
      title: seed.title,
      summary: seed.summary,
      translationOverrides: { es: ['title', 'summary'], pt: ['title', 'summary'] },
      author: seed.author,
      sourceName: seed.sourceName,
      url: seed.url,
      embedProvider: embed?.provider ?? null,
      embedId: embed?.id ?? null,
      embedKind: embed?.kind ?? null,
      thumbnailUrl: embed?.provider === 'youtube' ? youtubeThumbnail(embed.id) : null,
      contentLanguage: seed.contentLanguage,
      topics: seed.topics,
      level: seed.level,
      durationMinutes: null,
      publishedAt: null,
      buyUrl: null,
      affiliate: false,
      position: seed.position,
      active: true,
      createdBy: null,
    }),
  );
  if (brandId) {
    await links.save(links.create({ itemId: item.id, targetKind: 'brand', targetId: brandId, position: 0 }));
  }
}

async function main(): Promise<void> {
  await dataSource.initialize();
  const brands = dataSource.getRepository(Brand);
  for (const seed of SEED_ITEMS) {
    const brand = seed.brandSlug ? await brands.findOne({ where: { slug: seed.brandSlug } }) : null;
    if (seed.brandSlug && !brand) {
      console.warn(`Brand ${seed.brandSlug} is not in the catalogue yet; ${seed.slug} is seeded without the link.`);
    }
    await seedItem(seed, brand?.id ?? null);
  }
  console.log(`Seeded ${SEED_ITEMS.length} learn items (existing slugs left untouched).`);
  await dataSource.destroy();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
