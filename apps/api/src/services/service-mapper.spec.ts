import { Service } from './entities/service.entity';
import { toServiceAdminDetail, toServiceDetail, toServiceSummary } from './service-mapper';

const text = (value: string) => ({ en: value, es: value, pt: value });

function buildService(overrides: Partial<Service> = {}): Service {
  return Object.assign(new Service(), {
    id: 's1',
    slug: 'reserve-repack-sport',
    category: 'repack',
    name: text('Reserve repack'),
    summary: text('Sport rig'),
    descriptionMd: text('# Repack'),
    turnaroundNote: null,
    translationOverrides: { es: ['name'] },
    priceAmount: '55000.00',
    priceCurrency: 'ARS',
    position: 0,
    active: true,
    ...overrides,
  });
}

describe('service mappers', () => {
  test('a numeric amount string becomes a number', () => {
    expect(toServiceSummary(buildService()).priceAmount).toBe(55000);
  });

  test('a service without a price keeps null amount and currency', () => {
    const summary = toServiceSummary(buildService({ priceAmount: null, priceCurrency: null }));

    expect(summary.priceAmount).toBeNull();
    expect(summary.priceCurrency).toBeNull();
  });

  test('detail adds the description and turnaround note', () => {
    const detail = toServiceDetail(buildService({ turnaroundNote: text('3 days') }));

    expect(detail.descriptionMd.en).toBe('# Repack');
    expect(detail.turnaroundNote?.en).toBe('3 days');
  });

  test('admin detail adds the translation overrides', () => {
    expect(toServiceAdminDetail(buildService()).translationOverrides).toEqual({ es: ['name'] });
  });

  test('the public detail never exposes translation overrides', () => {
    expect(toServiceDetail(buildService())).not.toHaveProperty('translationOverrides');
  });
});
