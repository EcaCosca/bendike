import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ExchangeRatesController } from './exchange-rates.controller';
import { ExchangeRatesService } from './exchange-rates.service';

describe('ExchangeRatesController', () => {
  let controller: ExchangeRatesController;
  let service: { getRates: jest.Mock; refresh: jest.Mock; setOverride: jest.Mock; clearOverride: jest.Mock };

  beforeEach(async () => {
    service = { getRates: jest.fn(), refresh: jest.fn(), setOverride: jest.fn(), clearOverride: jest.fn() };
    const ref = await Test.createTestingModule({
      controllers: [ExchangeRatesController],
      providers: [{ provide: ExchangeRatesService, useValue: service }],
    }).compile();
    controller = ref.get(ExchangeRatesController);
  });

  test('setOverride rejects an unsupported currency before reaching the service', () => {
    expect(() => controller.setOverride('USD', { usdRate: 1 })).toThrow(BadRequestException);
    expect(service.setOverride).not.toHaveBeenCalled();
  });

  test('setOverride delegates a valid currency to the service', async () => {
    await controller.setOverride('ARS', { usdRate: 1300 });

    expect(service.setOverride).toHaveBeenCalledWith('ARS', 1300);
  });

  test('clearOverride rejects an unsupported currency', () => {
    expect(() => controller.clearOverride('EUR')).toThrow(BadRequestException);
  });
});
