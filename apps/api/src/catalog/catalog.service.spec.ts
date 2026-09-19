import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { CatalogService } from './catalog.service';

function buildQueryBuilder(rows: Product[], total: number) {
  const qb: Record<string, jest.Mock> = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([rows, total]),
  };
  return qb;
}

describe('CatalogService', () => {
  let service: CatalogService;
  let brands: { find: jest.Mock; findOne: jest.Mock };
  let categories: { find: jest.Mock; findOne: jest.Mock };
  let products: { find: jest.Mock; findOne: jest.Mock; createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    brands = { find: jest.fn(), findOne: jest.fn() };
    categories = { find: jest.fn(), findOne: jest.fn() };
    products = { find: jest.fn(), findOne: jest.fn(), createQueryBuilder: jest.fn() };

    const ref = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: getRepositoryToken(Brand), useValue: brands },
        { provide: getRepositoryToken(Category), useValue: categories },
        { provide: getRepositoryToken(Product), useValue: products },
      ],
    }).compile();
    service = ref.get(CatalogService);
  });

  describe('findProducts', () => {
    test('an unknown category slug returns an empty page without querying products', async () => {
      categories.findOne.mockResolvedValue(null);

      const page = await service.findProducts({ categorySlug: 'missing' });

      expect(page).toEqual({ items: [], page: 1, pageSize: 12, total: 0 });
      expect(products.createQueryBuilder).not.toHaveBeenCalled();
    });

    test('an unknown brand slug returns an empty page without querying products', async () => {
      brands.findOne.mockResolvedValue(null);

      const page = await service.findProducts({ brandSlug: 'missing' });

      expect(page).toEqual({ items: [], page: 1, pageSize: 12, total: 0 });
      expect(products.createQueryBuilder).not.toHaveBeenCalled();
    });

    test('a known category includes its children in the filter', async () => {
      categories.findOne.mockResolvedValue({ id: 'cat-1', slug: 'parachutes' });
      categories.find.mockResolvedValue([{ id: 'cat-2' }, { id: 'cat-3' }]);
      const qb = buildQueryBuilder([], 0);
      products.createQueryBuilder.mockReturnValue(qb);

      await service.findProducts({ categorySlug: 'parachutes' });

      expect(qb.andWhere).toHaveBeenCalledWith('product.category_id IN (:...categoryIds)', {
        categoryIds: ['cat-1', 'cat-2', 'cat-3'],
      });
    });

    test.each([
      ['price-asc', 'ASC'],
      ['price-desc', 'DESC'],
    ] as const)(
      'sort=%s orders by one USD-equivalent expression covering list and direct prices',
      async (sort, direction) => {
        const qb = buildQueryBuilder([], 0);
        products.createQueryBuilder.mockReturnValue(qb);

        await service.findProducts({ sort });

        expect(qb.addSelect).toHaveBeenCalledWith(expect.stringContaining('price_amount'), 'price_sort');
        expect(qb.addSelect).toHaveBeenCalledWith(expect.stringContaining('list_price_usd'), 'price_sort');
        expect(qb.orderBy).toHaveBeenCalledWith('price_sort', direction, 'NULLS LAST');
      },
    );

    test('condition filters to that condition', async () => {
      const qb = buildQueryBuilder([], 0);
      products.createQueryBuilder.mockReturnValue(qb);

      await service.findProducts({ condition: 'used' });

      expect(qb.andWhere).toHaveBeenCalledWith('product.condition = :condition', { condition: 'used' });
    });

    test('sold items are left out unless includeSold is set', async () => {
      const excluded = buildQueryBuilder([], 0);
      products.createQueryBuilder.mockReturnValue(excluded);
      await service.findProducts({});
      expect(excluded.andWhere).toHaveBeenCalledWith('product.sold_at IS NULL');

      const included = buildQueryBuilder([], 0);
      products.createQueryBuilder.mockReturnValue(included);
      await service.findProducts({ includeSold: true });
      expect(included.andWhere).not.toHaveBeenCalledWith('product.sold_at IS NULL');
    });

    test('maps rows through the product mapper and applies default pagination', async () => {
      const brand = Object.assign(new Brand(), {
        id: 'brand-1',
        slug: 'squirrel',
        name: 'Squirrel',
        websiteUrl: 'https://squirrel.ws',
        active: true,
      });
      const product = Object.assign(new Product(), {
        id: 'p1',
        slug: 'freak6',
        brandId: 'brand-1',
        categoryId: 'cat-1',
        name: { en: 'Freak 6', es: 'Freak 6', pt: 'Freak 6' },
        summary: { en: 'A wingsuit', es: 'x', pt: 'x' },
        listPriceUsd: '2090.00',
        markupPercent: '20.00',
        madeToOrder: false,
        active: true,
        images: [],
        brand,
      });
      const qb = buildQueryBuilder([product], 1);
      products.createQueryBuilder.mockReturnValue(qb);

      const page = await service.findProducts({});

      expect(page.page).toBe(1);
      expect(page.pageSize).toBe(12);
      expect(page.total).toBe(1);
      expect(page.items[0]!.slug).toBe('freak6');
      expect(page.items[0]!.listPriceUsd).toBe(2090);
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(12);
    });
  });

  describe('findProductBySlug', () => {
    test('throws NotFoundException for an unknown or inactive slug', async () => {
      products.findOne.mockResolvedValue(null);

      await expect(service.findProductBySlug('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    test('returns the mapped detail for a known active slug', async () => {
      const brand = Object.assign(new Brand(), {
        id: 'brand-1',
        slug: 'squirrel',
        name: 'Squirrel',
        websiteUrl: 'https://squirrel.ws',
        active: true,
      });
      const product = Object.assign(new Product(), {
        id: 'p1',
        slug: 'freak6',
        brandId: 'brand-1',
        categoryId: 'cat-1',
        name: { en: 'Freak 6', es: 'Freak 6', pt: 'Freak 6' },
        summary: { en: 'x', es: 'x', pt: 'x' },
        descriptionMd: { en: '# x', es: '# x', pt: '# x' },
        listPriceUsd: '2090.00',
        markupPercent: '20.00',
        madeToOrder: false,
        active: true,
        images: [],
        variants: [],
        brand,
      });
      products.findOne.mockResolvedValue(product);

      const detail = await service.findProductBySlug('freak6');

      expect(detail.slug).toBe('freak6');
      expect(detail.descriptionMd).toEqual({ en: '# x', es: '# x', pt: '# x' });
    });
  });
});
