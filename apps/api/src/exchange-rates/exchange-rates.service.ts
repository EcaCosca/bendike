import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ExchangeRates } from '@bendike/shared';
import { Repository } from 'typeorm';
import { ExchangeRateProviderClient } from './exchange-rate-provider.client';
import { ExchangeRate } from './exchange-rate.entity';
import { isStale } from './staleness';

const CURRENCIES = ['ARS', 'BRL'] as const;

@Injectable()
export class ExchangeRatesService implements OnModuleInit {
  constructor(
    @InjectRepository(ExchangeRate) private readonly rates: Repository<ExchangeRate>,
    private readonly provider: ExchangeRateProviderClient,
  ) {}

  async onModuleInit(): Promise<void> {
    const rows = await this.rates.find();
    const byCurrency = new Map(rows.map((row) => [row.currency, row]));
    const now = new Date();
    const anyStale = CURRENCIES.some((currency) => isStale(byCurrency.get(currency)?.fetchedAt ?? null, now));

    if (anyStale) {
      await this.refresh().catch(() => undefined);
    }
  }

  async getRates(): Promise<ExchangeRates> {
    const rows = await this.rates.find();
    const byCurrency = new Map(rows.map((row) => [row.currency, row]));

    return CURRENCIES.reduce((acc, currency) => {
      const row = byCurrency.get(currency);
      acc[currency] = row
        ? {
            currency,
            usdRate: Number(row.usdRate),
            source: row.source,
            fetchedAt: row.fetchedAt.toISOString(),
            manualOverride: row.manualOverride,
          }
        : { currency, usdRate: 0, source: 'none', fetchedAt: new Date(0).toISOString(), manualOverride: false };
      return acc;
    }, {} as ExchangeRates);
  }

  async refresh(): Promise<void> {
    let providerRates;
    try {
      providerRates = await this.provider.fetchRates();
    } catch {
      throw new ServiceUnavailableException('Exchange rate provider is unreachable; kept the last stored rates');
    }

    const rows = await this.rates.find();
    const overridden = new Set(rows.filter((row) => row.manualOverride).map((row) => row.currency));

    for (const currency of CURRENCIES) {
      if (overridden.has(currency)) {
        continue;
      }
      await this.rates.save(
        this.rates.create({
          currency,
          usdRate: String(providerRates[currency]),
          source: 'open.er-api.com',
          fetchedAt: new Date(),
          manualOverride: false,
        }),
      );
    }
  }

  async setOverride(currency: 'ARS' | 'BRL', usdRate: number): Promise<ExchangeRate> {
    return this.rates.save(
      this.rates.create({
        currency,
        usdRate: String(usdRate),
        source: 'manual',
        fetchedAt: new Date(),
        manualOverride: true,
      }),
    );
  }

  async clearOverride(currency: 'ARS' | 'BRL'): Promise<void> {
    await this.rates.update({ currency }, { manualOverride: false });
  }
}
