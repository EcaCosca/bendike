import { Test } from '@nestjs/testing';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

describe('CatalogController', () => {
  let controller: CatalogController;
  let service: {
    findBrands: jest.Mock;
    findCategories: jest.Mock;
    findProducts: jest.Mock;
    findProductBySlug: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findBrands: jest.fn(),
      findCategories: jest.fn(),
      findProducts: jest.fn(),
      findProductBySlug: jest.fn(),
    };
    const ref = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [{ provide: CatalogService, useValue: service }],
    }).compile();
    controller = ref.get(CatalogController);
  });

  test('findBrands delegates to the service', async () => {
    service.findBrands.mockResolvedValue([{ id: 'b1' }]);

    await expect(controller.findBrands()).resolves.toEqual([{ id: 'b1' }]);
  });

  test('findProducts passes the query through unchanged', async () => {
    const query = { categorySlug: 'wingsuits', page: 2 };
    service.findProducts.mockResolvedValue({ items: [], page: 2, pageSize: 12, total: 0 });

    await controller.findProducts(query);

    expect(service.findProducts).toHaveBeenCalledWith(query);
  });

  test('findProductBySlug delegates to the service', async () => {
    service.findProductBySlug.mockResolvedValue({ slug: 'freak6' });

    await expect(controller.findProductBySlug('freak6')).resolves.toEqual({ slug: 'freak6' });
    expect(service.findProductBySlug).toHaveBeenCalledWith('freak6');
  });
});
