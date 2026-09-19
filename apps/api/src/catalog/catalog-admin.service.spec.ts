import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ImageStorageService } from '../uploads/image-storage.service';
import { MAX_IMAGE_BYTES } from '../uploads/image-type';
import { CatalogAdminService } from './catalog-admin.service';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Product } from './entities/product.entity';

function buildProduct(overrides: Partial<Product> = {}): Product {
  return Object.assign(new Product(), {
    id: 'p1',
    slug: 'freak6',
    brandId: 'brand-1',
    categoryId: 'cat-1',
    name: { en: 'Freak 6', es: 'Freak 6', pt: 'Freak 6' },
    summary: { en: 'A wingsuit', es: 'x', pt: 'x' },
    descriptionMd: { en: '# Freak 6', es: '# x', pt: '# x' },
    translationOverrides: {},
    listPriceUsd: null,
    markupPercent: '20.00',
    madeToOrder: false,
    active: false,
    ...overrides,
  });
}

describe('CatalogAdminService', () => {
  let service: CatalogAdminService;
  let brands: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let categories: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let products: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let variants: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let images: { create: jest.Mock; save: jest.Mock; delete: jest.Mock; find: jest.Mock; findOne: jest.Mock };
  let storage: { save: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    brands = { create: jest.fn((v) => v), save: jest.fn((v) => Promise.resolve(v)), findOne: jest.fn() };
    categories = { create: jest.fn((v) => v), save: jest.fn((v) => Promise.resolve(v)), findOne: jest.fn() };
    products = { create: jest.fn((v) => v), save: jest.fn((v) => Promise.resolve(v)), findOne: jest.fn() };
    variants = { create: jest.fn((v) => v), save: jest.fn((v) => Promise.resolve(v)), findOne: jest.fn() };
    images = {
      create: jest.fn((v) => v),
      save: jest.fn((v) => Promise.resolve(v)),
      delete: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    };
    storage = { save: jest.fn().mockResolvedValue('/uploads/products/new.jpg'), remove: jest.fn() };

    const ref = await Test.createTestingModule({
      providers: [
        CatalogAdminService,
        { provide: getRepositoryToken(Brand), useValue: brands },
        { provide: getRepositoryToken(Category), useValue: categories },
        { provide: getRepositoryToken(Product), useValue: products },
        { provide: getRepositoryToken(ProductVariant), useValue: variants },
        { provide: getRepositoryToken(ProductImage), useValue: images },
        { provide: ImageStorageService, useValue: storage },
      ],
    }).compile();
    service = ref.get(CatalogAdminService);
  });

  describe('createBrand', () => {
    test('a brand can be created with no website', async () => {
      const brand = await service.createBrand({ slug: 'icarus', name: 'Icarus' });

      expect(brand).toMatchObject({ slug: 'icarus', name: 'Icarus', websiteUrl: '', active: true });
    });
  });

  describe('updateProduct', () => {
    test('rejects activating a product with no price', async () => {
      products.findOne.mockResolvedValue(buildProduct({ listPriceUsd: null }));

      await expect(service.updateProduct('p1', { active: true })).rejects.toBeInstanceOf(BadRequestException);
      expect(products.save).not.toHaveBeenCalled();
    });

    test('activates a product that has a price', async () => {
      products.findOne.mockResolvedValue(buildProduct({ listPriceUsd: '2090.00' }));

      const updated = await service.updateProduct('p1', { active: true });

      expect(updated.active).toBe(true);
    });

    test('throws NotFoundException for an unknown product', async () => {
      products.findOne.mockResolvedValue(null);

      await expect(service.updateProduct('missing', {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateProductCopy', () => {
    test('sets the field for the given locale and records the override', async () => {
      products.findOne.mockResolvedValue(buildProduct());

      const updated = await service.updateProductCopy('p1', { field: 'name', locale: 'es', value: 'Nombre' });

      expect(updated.name).toEqual({ en: 'Freak 6', es: 'Nombre', pt: 'Freak 6' });
      expect(updated.translationOverrides).toEqual({ es: ['name'] });
    });

    test('accumulates overrides across multiple edits without duplicating', async () => {
      products.findOne.mockResolvedValue(buildProduct({ translationOverrides: { es: ['name'] } }));

      const updated = await service.updateProductCopy('p1', { field: 'name', locale: 'es', value: 'Otro nombre' });

      expect(updated.translationOverrides).toEqual({ es: ['name'] });
    });

    test('tracks overrides for different fields and locales independently', async () => {
      products.findOne.mockResolvedValue(buildProduct({ translationOverrides: { es: ['name'] } }));

      const updated = await service.updateProductCopy('p1', {
        field: 'summary',
        locale: 'pt',
        value: 'Resumo',
      });

      expect(updated.translationOverrides).toEqual({ es: ['name'], pt: ['summary'] });
    });
  });

  describe('createVariant', () => {
    test('throws NotFoundException when the product does not exist', async () => {
      products.findOne.mockResolvedValue(null);

      await expect(
        service.createVariant('missing', { sku: 'X', optionNames: ['Size'], optionValues: ['M'] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    test('creates a variant scoped to the product', async () => {
      products.findOne.mockResolvedValue(buildProduct());

      const variant = await service.createVariant('p1', {
        sku: 'FREAK6-M',
        optionNames: ['Size'],
        optionValues: ['M'],
      });

      expect(variant).toMatchObject({ productId: 'p1', sku: 'FREAK6-M', active: true });
    });
  });

  describe('updateVariant', () => {
    test('throws NotFoundException for an unknown variant', async () => {
      variants.findOne.mockResolvedValue(null);

      await expect(service.updateVariant('missing', { active: false })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('uploadImages', () => {
    const jpeg = {
      originalname: 'a.jpg',
      mimetype: 'image/jpeg',
      size: 10,
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0]),
    };

    test('stores each valid photo and appends image rows after the existing ones', async () => {
      products.findOne.mockResolvedValue(buildProduct());
      images.find.mockResolvedValue([{ position: 0 }, { position: 1 }]);

      const created = await service.uploadImages('p1', [jpeg, jpeg]);

      expect(storage.save).toHaveBeenCalledTimes(2);
      expect(created.map((image) => image.position)).toEqual([2, 3]);
      expect(created[0]).toMatchObject({ productId: 'p1', url: '/uploads/products/new.jpg' });
    });

    test('rejects a file whose bytes are not JPEG, PNG or WebP, even with an image type claimed, and stores nothing', async () => {
      products.findOne.mockResolvedValue(buildProduct());
      const fake = { ...jpeg, buffer: Buffer.from('GIF89a') };

      await expect(service.uploadImages('p1', [jpeg, fake])).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.save).not.toHaveBeenCalled();
    });

    test('rejects a file over 5 MB and stores nothing', async () => {
      products.findOne.mockResolvedValue(buildProduct());

      await expect(service.uploadImages('p1', [{ ...jpeg, size: MAX_IMAGE_BYTES + 1 }])).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(storage.save).not.toHaveBeenCalled();
    });

    test('rejects a request with no files', async () => {
      products.findOne.mockResolvedValue(buildProduct());

      await expect(service.uploadImages('p1', [])).rejects.toBeInstanceOf(BadRequestException);
    });

    test('an unknown product is not found', async () => {
      products.findOne.mockResolvedValue(null);

      await expect(service.uploadImages('missing', [jpeg])).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteImage', () => {
    test('removes the stored file as well as the row', async () => {
      images.findOne.mockResolvedValue({ id: 'i1', url: '/uploads/products/x.jpg' });

      await service.deleteImage('i1');

      expect(storage.remove).toHaveBeenCalledWith('/uploads/products/x.jpg');
      expect(images.delete).toHaveBeenCalledWith('i1');
    });

    test('deleting an image that does not exist is not an error', async () => {
      images.findOne.mockResolvedValue(null);

      await expect(service.deleteImage('gone')).resolves.toBeUndefined();
      expect(storage.remove).not.toHaveBeenCalled();
    });
  });
});
