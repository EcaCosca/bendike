import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app.config.service';

export interface ProviderRates {
  ARS: number;
  BRL: number;
}

interface ProviderResponseBody {
  rates?: Record<string, number>;
}

@Injectable()
export class ExchangeRateProviderClient {
  constructor(private readonly config: AppConfigService) {}

  async fetchRates(): Promise<ProviderRates> {
    const response = await fetch(this.config.exchangeRateProviderUrl);
    if (!response.ok) {
      throw new Error(`Exchange rate provider responded with ${response.status}`);
    }

    const body = (await response.json()) as ProviderResponseBody;
    const ars = body.rates?.ARS;
    const brl = body.rates?.BRL;

    if (typeof ars !== 'number' || typeof brl !== 'number') {
      throw new Error('Exchange rate provider response is missing ARS or BRL');
    }

    return { ARS: ars, BRL: brl };
  }
}
