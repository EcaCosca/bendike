import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TranslationService } from '../translation/translation.service';
import { Service } from './entities/service.entity';
import { ServicesAdminService } from './services-admin.service';

const text = (value: string) => ({ en: value, es: value, pt: value });

function buildService(overrides: Partial<Service> = {}): Service {
  return Object.assign(new Service(), {
    id: 's1',
    slug: 'patchwork',
    category: 'repair',
    name: text('Patchwork'),
    summary: text('Repairs'),
    descriptionMd: text('# Patchwork'),
    turnaroundNote: null,
    translationOverrides: {},
    priceAmount: null,
    priceCurrency: null,
    position: 0,
    active: true,
    ...overrides,
  });
}

const createDto = {
  slug: 'reline',
  category: 'reline' as const,
  name: 'Reline',
  summary: 'New lines',
  descriptionMd: '# Reline',
};

describe('ServicesAdminService', () => {
  let admin: ServicesAdminService;
  let repository: { find: jest.Mock; findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let translation: { translateProductCopy: jest.Mock; translateField: jest.Mock };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((value: object) => Object.assign(new Service(), value)),
      save: jest.fn((value: Service) => Promise.resolve(value)),
    };
    translation = { translateProductCopy: jest.fn(), translateField: jest.fn() };
    const ref = await Test.createTestingModule({
      providers: [
        ServicesAdminService,
        { provide: getRepositoryToken(Service), useValue: repository },
        { provide: TranslationService, useValue: translation },
      ],
    }).compile();
    admin = ref.get(ServicesAdminService);
  });

  describe('create', () => {
    beforeEach(() => {
      repository.findOne.mockResolvedValue(null);
    });

    test('stores the translations the translation service returns', async () => {
      translation.translateProductCopy.mockResolvedValue({
        name: { es: 'Recableado', pt: 'Recabeamento' },
        summary: { es: 'Líneas nuevas', pt: 'Linhas novas' },
        descriptionMd: { es: '# Recableado', pt: '# Recabeamento' },
      });

      const created = await admin.create(createDto);

      expect(created.name).toEqual({ en: 'Reline', es: 'Recableado', pt: 'Recabeamento' });
      expect(created.active).toBe(true);
    });

    test('keeps English in a locale the translation service could not translate', async () => {
      translation.translateProductCopy.mockResolvedValue({
        name: { es: null, pt: null },
        summary: { es: null, pt: null },
        descriptionMd: { es: null, pt: null },
      });

      const created = await admin.create(createDto);

      expect(created.summary).toEqual(text('New lines'));
    });

    test('translates the turnaround note when one is given', async () => {
      translation.translateProductCopy.mockResolvedValue({
        name: { es: null, pt: null },
        summary: { es: null, pt: null },
        descriptionMd: { es: null, pt: null },
      });
      translation.translateField.mockResolvedValue({ es: '3 días', pt: null });

      const created = await admin.create({ ...createDto, turnaroundNote: '3 days' });

      expect(created.turnaroundNote).toEqual({ en: '3 days', es: '3 días', pt: '3 days' });
    });

    test('a slug that already exists is a conflict', async () => {
      repository.findOne.mockResolvedValue(buildService());

      await expect(admin.create(createDto)).rejects.toBeInstanceOf(ConflictException);
    });

    test.each([[{ priceAmount: 5000 }], [{ priceCurrency: 'ARS' as const }]])(
      'rejects an incomplete price %p before translating',
      async (price) => {
        await expect(admin.create({ ...createDto, ...price })).rejects.toBeInstanceOf(BadRequestException);
        expect(translation.translateProductCopy).not.toHaveBeenCalled();
      },
    );

    test('stores a complete price', async () => {
      translation.translateProductCopy.mockResolvedValue({
        name: { es: null, pt: null },
        summary: { es: null, pt: null },
        descriptionMd: { es: null, pt: null },
      });

      const created = await admin.create({ ...createDto, priceAmount: 55000, priceCurrency: 'ARS' });

      expect(created.priceAmount).toBe(55000);
      expect(created.priceCurrency).toBe('ARS');
    });
  });

  describe('update', () => {
    test('sets a price and currency together', async () => {
      repository.findOne.mockResolvedValue(buildService());

      const updated = await admin.update('s1', { priceAmount: 90000, priceCurrency: 'ARS' });

      expect(updated.priceAmount).toBe(90000);
    });

    test('changing only the amount keeps the existing currency', async () => {
      repository.findOne.mockResolvedValue(buildService({ priceAmount: '55000.00', priceCurrency: 'ARS' }));

      const updated = await admin.update('s1', { priceAmount: 60000 });

      expect(updated.priceAmount).toBe(60000);
      expect(updated.priceCurrency).toBe('ARS');
    });

    test('setting only a currency on a service with no price is rejected', async () => {
      repository.findOne.mockResolvedValue(buildService());

      await expect(admin.update('s1', { priceCurrency: 'USD' })).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    test('clearing both amount and currency makes the price vary', async () => {
      repository.findOne.mockResolvedValue(buildService({ priceAmount: '55000.00', priceCurrency: 'ARS' }));

      const updated = await admin.update('s1', { priceAmount: null, priceCurrency: null });

      expect(updated.priceAmount).toBeNull();
      expect(updated.priceCurrency).toBeNull();
    });

    test('deactivates a service', async () => {
      repository.findOne.mockResolvedValue(buildService());

      expect((await admin.update('s1', { active: false })).active).toBe(false);
    });

    test('an unknown id is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(admin.update('missing', {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateCopy', () => {
    test('sets one locale of a field and records the override', async () => {
      repository.findOne.mockResolvedValue(buildService());

      const updated = await admin.updateCopy('s1', { field: 'name', locale: 'es', value: 'Parches' });

      expect(updated.name).toEqual({ en: 'Patchwork', es: 'Parches', pt: 'Patchwork' });
      expect(updated.translationOverrides).toEqual({ es: ['name'] });
    });

    test('does not duplicate an override recorded before', async () => {
      repository.findOne.mockResolvedValue(buildService({ translationOverrides: { es: ['name'] } }));

      const updated = await admin.updateCopy('s1', { field: 'name', locale: 'es', value: 'Parches 2' });

      expect(updated.translationOverrides).toEqual({ es: ['name'] });
    });

    test('creates a turnaround note from a single locale when there is none', async () => {
      repository.findOne.mockResolvedValue(buildService());

      const updated = await admin.updateCopy('s1', { field: 'turnaroundNote', locale: 'en', value: '2 days' });

      expect(updated.turnaroundNote).toEqual({ en: '2 days', es: '', pt: '' });
    });
  });
});
