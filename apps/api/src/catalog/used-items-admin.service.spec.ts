import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TranslationService } from '../translation/translation.service';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { UsedItemsAdminService } from './used-items-admin.service';

const text = (value: string) => ({ en: value, es: value, pt: value });

function brand(): Brand {
  return Object.assign(new Brand(), { id: 'b1', slug: 'icarus', name: 'Icarus', websiteUrl: '', active: true });
}

function usedProduct(overrides: Partial<Product> = {}): Product {
  return Object.assign(new Product(), {
    id: 'p1',
    slug: 'safire-3',
    brandId: 'b1',
    categoryId: 'c1',
    brand: brand(),
    name: text('Safire 3'),
    summary: text('A canopy'),
    descriptionMd: text('# Safire'),
    translationOverrides: {},
    listPriceUsd: null,
    markupPercent: '0.00',
    condition: 'used',
    priceAmount: '600.00',
    priceCurrency: 'USD',
    soldAt: null,
    madeToOrder: false,
    active: true,
    images: [],
    variants: [],
    ...overrides,
  });
}

const createDto = {
  name: 'Safire 3',
  summary: 'A canopy',
  descriptionMd: '# Safire',
  brandId: 'b1',
  categoryId: 'c1',
  priceAmount: 600,
  priceCurrency: 'USD' as const,
};

describe('UsedItemsAdminService', () => {
  let service: UsedItemsAdminService;
  let products: { find: jest.Mock; findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let brands: { findOne: jest.Mock };
  let categories: { findOne: jest.Mock };
  let translation: { translateProductCopy: jest.Mock };

  beforeEach(async () => {
    products = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((value: object) => Object.assign(new Product(), value)),
      save: jest.fn((value: Product) => Promise.resolve(Object.assign(value, { id: value.id ?? 'new-id' }))),
    };
    brands = { findOne: jest.fn().mockResolvedValue(brand()) };
    categories = { findOne: jest.fn().mockResolvedValue({ id: 'c1' }) };
    translation = {
      translateProductCopy: jest.fn().mockResolvedValue({
        name: { es: 'Safire 3 ES', pt: null },
        summary: { es: null, pt: null },
        descriptionMd: { es: null, pt: null },
      }),
    };
    const ref = await Test.createTestingModule({
      providers: [
        UsedItemsAdminService,
        { provide: getRepositoryToken(Product), useValue: products },
        { provide: getRepositoryToken(Brand), useValue: brands },
        { provide: getRepositoryToken(Category), useValue: categories },
        { provide: TranslationService, useValue: translation },
      ],
    }).compile();
    service = ref.get(UsedItemsAdminService);
  });

  describe('create', () => {
    beforeEach(() => {
      products.findOne.mockResolvedValue(null);
    });

    test('creates an active used item with a direct price, no markup and translated copy', async () => {
      const created = await service.create(createDto);

      expect(created).toMatchObject({
        slug: 'safire-3',
        condition: 'used',
        active: true,
        sold: false,
        listPriceUsd: null,
        markupPercent: 0,
        priceAmount: 600,
        priceCurrency: 'USD',
      });
      expect(created.name).toEqual({ en: 'Safire 3', es: 'Safire 3 ES', pt: 'Safire 3' });
    });

    test('two items with the same name get different slugs', async () => {
      products.findOne
        .mockResolvedValueOnce(usedProduct())
        .mockResolvedValueOnce(usedProduct())
        .mockResolvedValueOnce(null);

      const created = await service.create(createDto);

      expect(created.slug).toBe('safire-3-3');
    });

    test('a name with no letters or digits still gets a slug', async () => {
      const created = await service.create({ ...createDto, name: '***' });

      expect(created.slug).toBe('used-item');
    });

    test.each([
      ['brand', () => brands.findOne.mockResolvedValue(null)],
      ['category', () => categories.findOne.mockResolvedValue(null)],
    ])('an unknown %s is a bad request', async (_name, arrange) => {
      arrange();

      await expect(service.create(createDto)).rejects.toBeInstanceOf(BadRequestException);
      expect(products.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    test('lists only used items, sold ones included, with their sold date', async () => {
      products.find.mockResolvedValue([usedProduct({ soldAt: new Date('2026-09-19T10:00:00Z') })]);

      const items = await service.findAll();

      expect(products.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { condition: 'used' }, relations: expect.objectContaining({ images: true }) }),
      );
      expect(items[0]).toMatchObject({ sold: true, soldAt: '2026-09-19T10:00:00.000Z' });
    });
  });

  describe('update', () => {
    test('marking sold records when', async () => {
      products.findOne.mockResolvedValue(usedProduct());

      const updated = await service.update('p1', { sold: true });

      expect(updated.sold).toBe(true);
      expect(updated.soldAt).not.toBeNull();
    });

    test('marking sold again keeps the original sale date', async () => {
      products.findOne.mockResolvedValue(usedProduct({ soldAt: new Date('2026-01-01T00:00:00Z') }));

      const updated = await service.update('p1', { sold: true });

      expect(updated.soldAt).toBe('2026-01-01T00:00:00.000Z');
    });

    test('marking available clears the sale date', async () => {
      products.findOne.mockResolvedValue(usedProduct({ soldAt: new Date() }));

      const updated = await service.update('p1', { sold: false });

      expect(updated.sold).toBe(false);
      expect(updated.soldAt).toBeNull();
    });

    test('changes the price and currency together', async () => {
      products.findOne.mockResolvedValue(usedProduct());

      const updated = await service.update('p1', { priceAmount: 450000, priceCurrency: 'ARS' });

      expect(updated).toMatchObject({ priceAmount: 450000, priceCurrency: 'ARS' });
    });

    test.each([[{ priceAmount: 5 }], [{ priceCurrency: 'ARS' as const }]])(
      'a price change needs both amount and currency: %p',
      async (body) => {
        products.findOne.mockResolvedValue(usedProduct());

        await expect(service.update('p1', body)).rejects.toBeInstanceOf(BadRequestException);
      },
    );

    test('a new-condition product is not reachable through the used-item endpoints', async () => {
      products.findOne.mockResolvedValue(null);

      await expect(service.update('p2', { sold: true })).rejects.toBeInstanceOf(NotFoundException);
      expect(products.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'p2', condition: 'used' } }),
      );
    });

    test('an unknown brand is a bad request', async () => {
      products.findOne.mockResolvedValue(usedProduct());
      brands.findOne.mockResolvedValue(null);

      await expect(service.update('p1', { brandId: 'nope' })).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
