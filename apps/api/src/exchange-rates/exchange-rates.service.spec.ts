import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExchangeRateProviderClient } from './exchange-rate-provider.client';
import { ExchangeRate } from './exchange-rate.entity';
import { ExchangeRatesService } from './exchange-rates.service';

function buildRow(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
  return Object.assign(new ExchangeRate(), {
    currency: 'ARS',
    usdRate: '1000.000000',
    source: 'open.er-api.com',
    fetchedAt: new Date(),
    manualOverride: false,
    ...overrides,
  });
}

describe('ExchangeRatesService', () => {
  let service: ExchangeRatesService;
  let repository: { find: jest.Mock; create: jest.Mock; save: jest.Mock; update: jest.Mock };
  let provider: { fetchRates: jest.Mock };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn((value) => Promise.resolve(value)),
      update: jest.fn(),
    };
    provider = { fetchRates: jest.fn() };

    const ref = await Test.createTestingModule({
      providers: [
        ExchangeRatesService,
        { provide: getRepositoryToken(ExchangeRate), useValue: repository },
        { provide: ExchangeRateProviderClient, useValue: provider },
      ],
    }).compile();
    service = ref.get(ExchangeRatesService);
  });

  describe('refresh', () => {
    test('updates non-overridden rows and leaves overrides alone', async () => {
      repository.find.mockResolvedValue([buildRow({ currency: 'ARS', manualOverride: true, usdRate: '999.000000' })]);
      provider.fetchRates.mockResolvedValue({ ARS: 1500, BRL: 5 });

      await service.refresh();

      const savedCurrencies = repository.save.mock.calls.map((call) => call[0].currency);
      expect(savedCurrencies).toEqual(['BRL']);
    });

    test('a provider failure keeps old rates and reports the failure', async () => {
      provider.fetchRates.mockRejectedValue(new Error('network down'));

      await expect(service.refresh()).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('onModuleInit', () => {
    test('refreshes when a rate is missing', async () => {
      repository.find.mockResolvedValueOnce([buildRow({ currency: 'ARS' })]).mockResolvedValueOnce([]);
      provider.fetchRates.mockResolvedValue({ ARS: 1500, BRL: 5 });

      await service.onModuleInit();

      expect(provider.fetchRates).toHaveBeenCalledTimes(1);
    });

    test('refreshes when a rate is older than 24 hours', async () => {
      const stale = new Date(Date.now() - 25 * 60 * 60 * 1000);
      repository.find
        .mockResolvedValueOnce([buildRow({ currency: 'ARS', fetchedAt: stale }), buildRow({ currency: 'BRL' })])
        .mockResolvedValueOnce([]);
      provider.fetchRates.mockResolvedValue({ ARS: 1500, BRL: 5 });

      await service.onModuleInit();

      expect(provider.fetchRates).toHaveBeenCalledTimes(1);
    });

    test('does not refresh when every rate is fresh', async () => {
      repository.find.mockResolvedValue([buildRow({ currency: 'ARS' }), buildRow({ currency: 'BRL' })]);

      await service.onModuleInit();

      expect(provider.fetchRates).not.toHaveBeenCalled();
    });

    test('a provider failure during startup refresh does not crash boot', async () => {
      repository.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      provider.fetchRates.mockRejectedValue(new Error('network down'));

      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('setOverride and clearOverride', () => {
    test('setOverride stores a manual rate', async () => {
      const saved = await service.setOverride('ARS', 1300);

      expect(saved).toMatchObject({ currency: 'ARS', usdRate: '1300', manualOverride: true, source: 'manual' });
    });

    test('clearOverride unsets the manual flag', async () => {
      await service.clearOverride('ARS');

      expect(repository.update).toHaveBeenCalledWith({ currency: 'ARS' }, { manualOverride: false });
    });
  });

  describe('getRates', () => {
    test('shapes stored rows into the ExchangeRates contract', async () => {
      repository.find.mockResolvedValue([buildRow({ currency: 'ARS', usdRate: '1500.000000' })]);

      const rates = await service.getRates();

      expect(rates.ARS.usdRate).toBe(1500);
      expect(rates.BRL.source).toBe('none');
    });
  });
});
