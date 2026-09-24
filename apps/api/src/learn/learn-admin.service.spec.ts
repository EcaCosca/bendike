import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { Brand } from '../catalog/entities/brand.entity';
import { Product } from '../catalog/entities/product.entity';
import { GearModel } from '../gear/entities/gear-model.entity';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { buildUser } from '../users/user.factory';
import type { CreateLearnItemDto } from './dto/learn.dto';
import { LearnCollection } from './entities/learn-collection.entity';
import { LearnItemLink } from './entities/learn-item-link.entity';
import { LearnItem } from './entities/learn-item.entity';
import { LearnAdminService } from './learn-admin.service';

const createDto: CreateLearnItemDto = {
  slug: 'cuatro-battery',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  format: 'video',
  title: 'Changing the Vigil Cuatro battery',
  summary: 'The manufacturer shows the battery exchange step by step.',
  sourceName: 'Vigil',
  contentLanguage: 'en',
  topics: ['aad', 'gear_care'],
  level: 'all',
};

describe('LearnAdminService', () => {
  let manager: InMemoryManager;
  let translation: { translateField: jest.Mock };
  let admin: LearnAdminService;
  const eca = buildUser({ role: Role.Admin });

  beforeEach(() => {
    manager = new InMemoryManager();
    translation = { translateField: jest.fn().mockResolvedValue({ es: null, pt: null }) };
    admin = new LearnAdminService(manager as never, translation as never);
  });

  describe('create', () => {
    test('derives the YouTube embed and thumbnail from the URL and keeps English where translation fails', async () => {
      translation.translateField.mockResolvedValueOnce({ es: 'Cambio de batería', pt: null });

      const created = await admin.create(eca, createDto);

      expect(created.embed).toEqual({ provider: 'youtube', id: 'dQw4w9WgXcQ', kind: 'video' });
      expect(created.thumbnailUrl).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
      expect(created.title).toEqual({
        en: 'Changing the Vigil Cuatro battery',
        es: 'Cambio de batería',
        pt: 'Changing the Vigil Cuatro battery',
      });
      expect(created.active).toBe(true);
      expect(created.affiliate).toBe(false);
      expect(created.links).toEqual([]);
      expect((await manager.findOne(LearnItem, { where: { slug: 'cuatro-battery' } }))?.createdBy).toBe(eca.id);
    });

    test('stores a plain link with no embed and honours an explicit thumbnail and buy link', async () => {
      const created = await admin.create(eca, {
        ...createDto,
        slug: 'squirrel-learn',
        url: 'https://squirrel.ws/learn/',
        format: 'page',
        thumbnailUrl: 'https://squirrel.ws/logo.png',
        buyUrl: 'https://www.amazon.com/dp/0977627705',
        affiliate: true,
      });

      expect(created.embed).toBeNull();
      expect(created.thumbnailUrl).toBe('https://squirrel.ws/logo.png');
      expect(created.buyUrl).toBe('https://www.amazon.com/dp/0977627705');
      expect(created.affiliate).toBe(true);
    });

    test('refuses a duplicate slug', async () => {
      await admin.create(eca, createDto);

      await expect(admin.create(eca, createDto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    test('re-derives the embed when the URL changes and deactivating keeps the row', async () => {
      const created = await admin.create(eca, createDto);

      const moved = await admin.update(created.id, {
        url: 'https://open.spotify.com/show/3WjzoEn19X2rCimimh9C5N',
        format: 'podcast',
        active: false,
        author: 'Exit Point',
      });

      expect(moved.embed).toEqual({ provider: 'spotify', id: '3WjzoEn19X2rCimimh9C5N', kind: 'show' });
      expect(moved.format).toBe('podcast');
      expect(moved.active).toBe(false);
      expect(moved.author).toBe('Exit Point');
      expect(await manager.count(LearnItem, {})).toBe(1);
      await expect(admin.update('00000000-0000-4000-8000-000000000999', {})).rejects.toBeInstanceOf(NotFoundException);
    });

    test('updateCopy edits one locale and records the override', async () => {
      const created = await admin.create(eca, createDto);

      const edited = await admin.updateCopy(created.id, { field: 'title', locale: 'pt', value: 'Troca da bateria' });

      expect(edited.title.pt).toBe('Troca da bateria');
      expect(edited.title.en).toBe(createDto.title);
      expect(edited.translationOverrides).toEqual({ pt: ['title'] });
    });
  });

  describe('replaceLinks', () => {
    test('replaces the links in order, dropping duplicates, and rejects an unknown target', async () => {
      const brand = manager.seed(Brand, {
        slug: 'vigil',
        name: 'Vigil',
        websiteUrl: 'https://vigil.aero',
        active: true,
      });
      const product = manager.seed(Product, { slug: 'vigil-cuatro', brandId: brand.id });
      const model = manager.seed(GearModel, { kind: 'aad', manufacturer: 'Vigil', model: 'Cuatro', active: true });
      const created = await admin.create(eca, createDto);

      const linked = await admin.replaceLinks(created.id, {
        links: [
          { kind: 'product', targetId: product.id },
          { kind: 'gear_model', targetId: model.id },
          { kind: 'product', targetId: product.id },
        ],
      });

      expect(linked.links).toEqual([
        { kind: 'product', targetId: product.id },
        { kind: 'gear_model', targetId: model.id },
      ]);

      const again = await admin.replaceLinks(created.id, { links: [{ kind: 'brand', targetId: brand.id }] });

      expect(again.links).toEqual([{ kind: 'brand', targetId: brand.id }]);
      expect(await manager.count(LearnItemLink, {})).toBe(1);
      await expect(
        admin.replaceLinks(created.id, {
          links: [{ kind: 'brand', targetId: '00000000-0000-4000-8000-000000000999' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('collections', () => {
    test('creates a collection with ordered members and allows one start-here per topic', async () => {
      const first = await admin.create(eca, createDto);
      const second = await admin.create(eca, { ...createDto, slug: 'second' });

      const collection = await admin.createCollection({
        slug: 'first-aad',
        title: 'Your first AAD',
        intro: 'Start here.',
        topic: 'aad',
        startHere: true,
        itemIds: [second.id, first.id],
      });

      expect(collection.itemIds).toEqual([second.id, first.id]);
      expect(collection.startHere).toBe(true);
      await expect(
        admin.createCollection({ slug: 'another', title: 'A', intro: 'B', topic: 'aad', startHere: true, itemIds: [] }),
      ).rejects.toBeInstanceOf(ConflictException);
      await expect(
        admin.createCollection({
          slug: 'bad',
          title: 'A',
          intro: 'B',
          topic: 'canopy',
          itemIds: ['00000000-0000-4000-8000-000000000999'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        admin.createCollection({ slug: 'first-aad', title: 'A', intro: 'B', topic: 'canopy', itemIds: [] }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    test('updates members and refuses to make a second start-here for the same topic', async () => {
      const item = await admin.create(eca, createDto);
      const start = await admin.createCollection({
        slug: 'start',
        title: 'Start',
        intro: 'Intro',
        topic: 'aad',
        startHere: true,
        itemIds: [],
      });
      const other = await admin.createCollection({
        slug: 'other',
        title: 'Other',
        intro: 'Intro',
        topic: 'aad',
        itemIds: [item.id],
      });

      await expect(admin.updateCollection(other.id, { startHere: true })).rejects.toBeInstanceOf(ConflictException);

      const moved = await admin.updateCollection(other.id, { topic: 'canopy', startHere: true, itemIds: [] });

      expect(moved.topic).toBe('canopy');
      expect(moved.startHere).toBe(true);
      expect(moved.itemIds).toEqual([]);
      expect((await admin.updateCollection(start.id, { active: false })).active).toBe(false);
      expect((await manager.find(LearnCollection, {})).length).toBe(2);
      expect((await admin.findAllCollections()).map((c) => c.slug)).toEqual(['other', 'start']);
    });
  });

  test('findAll lists inactive items too, with their links', async () => {
    const brand = manager.seed(Brand, { slug: 'vigil', name: 'Vigil', websiteUrl: 'https://vigil.aero', active: true });
    const created = await admin.create(eca, createDto);
    await admin.replaceLinks(created.id, { links: [{ kind: 'brand', targetId: brand.id }] });
    await admin.update(created.id, { active: false });

    const all = await admin.findAll();

    expect(all).toHaveLength(1);
    expect(all[0]?.active).toBe(false);
    expect(all[0]?.links).toEqual([{ kind: 'brand', targetId: brand.id }]);
  });
});
