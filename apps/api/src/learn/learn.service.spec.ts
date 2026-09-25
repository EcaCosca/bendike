import { NotFoundException } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { Brand } from '../catalog/entities/brand.entity';
import { Product } from '../catalog/entities/product.entity';
import { GearItem } from '../gear/entities/gear-item.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearAccessService } from '../gear/gear-access.service';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { linkedTo, noLinks } from '../gear/testing/no-links';
import { buildUser } from '../users/user.factory';
import { LearnCollection, LearnCollectionItem } from './entities/learn-collection.entity';
import { LearnItemLink } from './entities/learn-item-link.entity';
import { LearnItem } from './entities/learn-item.entity';
import { LearnService } from './learn.service';

const text = (value: string) => ({ en: value, es: `${value} es`, pt: `${value} pt` });

describe('LearnService', () => {
  let manager: InMemoryManager;
  let service: LearnService;
  const owner = buildUser({ role: Role.User });
  const rigger = buildUser({ role: Role.Rigger });
  const stranger = buildUser({ role: Role.User });

  function addItem(slug: string, values: Partial<LearnItem> = {}): LearnItem {
    return manager.seed(LearnItem, {
      slug,
      format: 'video',
      title: text(slug),
      summary: text(`${slug} summary`),
      translationOverrides: {},
      author: null,
      sourceName: 'Squirrel',
      url: `https://example.com/${slug}`,
      embedProvider: null,
      embedId: null,
      embedKind: null,
      thumbnailUrl: null,
      contentLanguage: 'en',
      topics: ['wingsuit'],
      level: 'all',
      durationMinutes: null,
      publishedAt: null,
      buyUrl: null,
      affiliate: false,
      position: 0,
      active: true,
      createdBy: null,
      ...values,
    });
  }

  function link(itemId: string, targetKind: LearnItemLink['targetKind'], targetId: string, position = 0) {
    manager.seed(LearnItemLink, { itemId, targetKind, targetId, position });
  }

  beforeEach(() => {
    manager = new InMemoryManager();
    service = new LearnService(manager as never, new GearAccessService(linkedTo([rigger.id, owner.id])));
  });

  describe('films', () => {
    test('keeps films off the Learn page and serves them on their own', async () => {
      addItem('reel', { format: 'film' });
      addItem('how-to-pack');

      expect((await service.search({})).items.map((item) => item.slug)).toEqual(['how-to-pack']);
      expect((await service.films()).map((item) => item.slug)).toEqual(['reel']);
    });

    test('leaves an inactive film out of the carousel', async () => {
      addItem('retired-reel', { format: 'film', active: false });

      expect(await service.films()).toEqual([]);
    });

    test('does not offer a film as related material', async () => {
      addItem('deployments', { topics: ['wingsuit'] });
      addItem('season-reel', { format: 'film', topics: ['wingsuit'] });
      addItem('flare', { topics: ['wingsuit'] });

      const related = await service.related('deployments');

      expect(related.map((item) => item.slug)).toEqual(['flare']);
    });
  });

  describe('search', () => {
    test('returns only active items, newest first, paginated', async () => {
      addItem('old');
      addItem('hidden', { active: false });
      addItem('new');

      const page = await service.search({ pageSize: 1 });

      expect(page.total).toBe(2);
      expect(page.items.map((item) => item.slug)).toEqual(['new']);
      expect((await service.search({ page: 2, pageSize: 1 })).items.map((item) => item.slug)).toEqual(['old']);
    });

    test('combines topic, format, level, language and text filters', async () => {
      addItem('aad-video', { topics: ['aad'], level: 'student', contentLanguage: 'es' });
      addItem('aad-podcast', { topics: ['aad'], format: 'podcast', level: 'all' });
      addItem('canopy', { topics: ['canopy'], author: 'Brian Germain' });

      expect((await service.search({ topic: 'aad' })).items.map((i) => i.slug).sort()).toEqual([
        'aad-podcast',
        'aad-video',
      ]);
      expect((await service.search({ topic: 'aad', type: 'podcast' })).items.map((i) => i.slug)).toEqual([
        'aad-podcast',
      ]);
      expect((await service.search({ level: 'student' })).items.map((i) => i.slug).sort()).toEqual([
        'aad-podcast',
        'aad-video',
        'canopy',
      ]);
      expect((await service.search({ lang: 'es' })).items.map((i) => i.slug)).toEqual(['aad-video']);
      expect((await service.search({ q: 'germain' })).items.map((i) => i.slug)).toEqual(['canopy']);
      expect((await service.search({ q: 'nothing here' })).total).toBe(0);
    });

    test('sorts by the localised title when asked', async () => {
      addItem('b', { title: { en: 'Bravo', es: 'Alfa', pt: 'Bravo' } });
      addItem('a', { title: { en: 'Alpha', es: 'Zulu', pt: 'Alpha' } });

      expect((await service.search({ sort: 'title' })).items.map((i) => i.slug)).toEqual(['a', 'b']);
      expect((await service.search({ sort: 'title', locale: 'es' })).items.map((i) => i.slug)).toEqual(['b', 'a']);
    });
  });

  describe('findBySlug and related', () => {
    test('returns the item with its links and hides inactive ones', async () => {
      const item = addItem('vigil-cuatro-battery', { topics: ['aad', 'gear_care'] });
      link(item.id, 'brand', 'b1');
      addItem('gone', { active: false });

      const detail = await service.findBySlug('vigil-cuatro-battery');

      expect(detail.links).toEqual([{ kind: 'brand', targetId: 'b1' }]);
      await expect(service.findBySlug('gone')).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.findBySlug('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    test('related shares a topic, excludes the item itself and inactive ones, six at most', async () => {
      addItem('me', { topics: ['aad'] });
      for (let i = 0; i < 7; i++) {
        addItem(`aad-${i}`, { topics: ['aad'], position: i });
      }
      addItem('canopy', { topics: ['canopy'] });
      addItem('inactive', { topics: ['aad'], active: false });

      const related = await service.related('me');

      expect(related).toHaveLength(6);
      expect(related.map((i) => i.slug)).toEqual(['aad-0', 'aad-1', 'aad-2', 'aad-3', 'aad-4', 'aad-5']);
    });
  });

  describe('forProduct', () => {
    test('prefers the product links and falls back to the brand, active only', async () => {
      const brand = manager.seed(Brand, {
        slug: 'vigil',
        name: 'Vigil',
        websiteUrl: 'https://vigil.aero',
        active: true,
      });
      const product = manager.seed(Product, { slug: 'vigil-cuatro', brandId: brand.id });
      const brandItem = addItem('vigil-channel');
      link(brandItem.id, 'brand', brand.id);

      expect((await service.forProduct(product.id)).map((i) => i.slug)).toEqual(['vigil-channel']);

      const productItem = addItem('cuatro-video');
      const hidden = addItem('hidden', { active: false });
      link(productItem.id, 'product', product.id, 1);
      link(hidden.id, 'product', product.id, 0);

      expect((await service.forProduct(product.id)).map((i) => i.slug)).toEqual(['cuatro-video']);
      expect(await service.forProduct('00000000-0000-4000-8000-000000000999')).toEqual([]);
    });
  });

  describe('forRig and forGearItem', () => {
    function addRig() {
      const rig = manager.seed(Rig, { ownerId: owner.id, name: 'Main rig', notes: '', active: true });
      const aad = manager.seed(GearItem, {
        ownerId: owner.id,
        rigId: rig.id,
        modelId: 'model-aad',
        kind: 'aad',
        manufacturer: 'Vigil',
        model: 'Cuatro',
        serial: null,
        manufacturedOn: null,
        notes: '',
        retiredAt: null,
      });
      manager.seed(GearItem, {
        ownerId: owner.id,
        rigId: rig.id,
        modelId: null,
        kind: 'main',
        manufacturer: 'PD',
        model: 'Sabre3',
        serial: null,
        manufacturedOn: null,
        notes: '',
        retiredAt: null,
      });
      return { rig, aad };
    }

    test('groups items by component for the owner and a linked rigger, 404 for a stranger', async () => {
      const { rig, aad } = addRig();
      const item = addItem('cuatro-battery');
      link(item.id, 'gear_model', 'model-aad');

      const sections = await service.forRig(owner, rig.id);

      expect(sections).toEqual([
        { gearItemId: aad.id, label: 'Vigil Cuatro', items: [expect.objectContaining({ slug: 'cuatro-battery' })] },
      ]);
      expect(await service.forRig(rigger, rig.id)).toHaveLength(1);
      await expect(service.forRig(stranger, rig.id)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.forRig(owner, '00000000-0000-4000-8000-000000000999')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    test('forGearItem returns the items of the component model and nothing for a component without a model', async () => {
      const { aad } = addRig();
      const item = addItem('cuatro-battery');
      link(item.id, 'gear_model', 'model-aad');
      const stranger2 = buildUser({ role: Role.Dropzone });

      expect((await service.forGearItem(owner, aad.id)).map((i) => i.slug)).toEqual(['cuatro-battery']);
      await expect(service.forGearItem(stranger2, aad.id)).rejects.toBeInstanceOf(NotFoundException);
    });

    test('a stranger without links gets nothing even as a rigger', async () => {
      service = new LearnService(manager as never, new GearAccessService(noLinks));
      const { rig } = addRig();

      await expect(service.forRig(rigger, rig.id)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('collections', () => {
    test('lists active collections with their active items in order, start-here first', async () => {
      const first = addItem('first');
      const second = addItem('second');
      const hidden = addItem('hidden', { active: false });
      const startHere = manager.seed(LearnCollection, {
        slug: 'start-aad',
        title: text('Start with AADs'),
        intro: text('Intro'),
        topic: 'aad',
        startHere: true,
        active: true,
      });
      const other = manager.seed(LearnCollection, {
        slug: 'deep-aad',
        title: text('Deeper'),
        intro: text('Intro'),
        topic: 'aad',
        startHere: false,
        active: true,
      });
      manager.seed(LearnCollection, {
        slug: 'off',
        title: text('Off'),
        intro: text('Intro'),
        topic: 'aad',
        startHere: false,
        active: false,
      });
      manager.seed(LearnCollectionItem, { collectionId: startHere.id, itemId: second.id, position: 1 });
      manager.seed(LearnCollectionItem, { collectionId: startHere.id, itemId: first.id, position: 0 });
      manager.seed(LearnCollectionItem, { collectionId: startHere.id, itemId: hidden.id, position: 2 });
      manager.seed(LearnCollectionItem, { collectionId: other.id, itemId: first.id, position: 0 });

      const collections = await service.collections('aad');

      expect(collections.map((c) => c.slug)).toEqual(['start-aad', 'deep-aad']);
      expect(collections[0]?.items.map((i) => i.slug)).toEqual(['first', 'second']);
      expect(await service.collections('canopy')).toEqual([]);
      expect((await service.collectionBySlug('deep-aad')).items.map((i) => i.slug)).toEqual(['first']);
      await expect(service.collectionBySlug('off')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
