import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServicesService } from './services.service';

const text = (value: string) => ({ en: value, es: value, pt: value });

function buildService(): Service {
  return Object.assign(new Service(), {
    id: 's1',
    slug: 'reline',
    category: 'reline',
    name: text('Reline'),
    summary: text('New lines'),
    descriptionMd: text('# Reline'),
    turnaroundNote: null,
    translationOverrides: {},
    priceAmount: null,
    priceCurrency: null,
    position: 3,
    active: true,
  });
}

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: { find: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    repository = { find: jest.fn(), findOne: jest.fn() };
    const ref = await Test.createTestingModule({
      providers: [ServicesService, { provide: getRepositoryToken(Service), useValue: repository }],
    }).compile();
    service = ref.get(ServicesService);
  });

  test('findActive asks only for active services, ordered by position then slug', async () => {
    repository.find.mockResolvedValue([buildService()]);

    const result = await service.findActive();

    expect(repository.find).toHaveBeenCalledWith({ where: { active: true }, order: { position: 'ASC', slug: 'ASC' } });
    expect(result.map((s) => s.slug)).toEqual(['reline']);
  });

  test('findActiveBySlug returns the detail of an active service', async () => {
    repository.findOne.mockResolvedValue(buildService());

    const detail = await service.findActiveBySlug('reline');

    expect(repository.findOne).toHaveBeenCalledWith({ where: { slug: 'reline', active: true } });
    expect(detail.descriptionMd.en).toBe('# Reline');
  });

  test('findActiveBySlug throws NotFoundException for an unknown or inactive slug', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findActiveBySlug('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
