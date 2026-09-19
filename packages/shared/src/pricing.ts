import type { ExchangeRates } from './catalog';

export type Currency = 'USD' | 'ARS' | 'BRL';

export const PRICE_CURRENCIES = ['ARS', 'USD'] as const;

export type PriceCurrency = (typeof PRICE_CURRENCIES)[number];

const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: 'en-US',
  ARS: 'es-AR',
  BRL: 'pt-BR',
};

function round2(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function bendikePriceUsd(listPriceUsd: number, markupPercent: number): number {
  return round2(listPriceUsd * (1 + markupPercent / 100));
}

export function convert(amountUsd: number, rate: number): number {
  return round2(amountUsd * rate);
}

const CURRENCY_PREFIXES: Record<Currency, string> = {
  USD: 'US$',
  ARS: 'AR$',
  BRL: 'R$',
};

export function formatMoney(amount: number, currency: Currency): string {
  const number = new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${CURRENCY_PREFIXES[currency]}\u00a0${number}`;
}

export interface Money {
  amount: number;
  currency: Currency;
}

export interface PriceFigures {
  primary: Money;
  derived: Money[];
}

export function priceFigures(
  priceAmount: number | null,
  priceCurrency: PriceCurrency | null,
  rates: ExchangeRates | null,
): PriceFigures | null {
  if (priceAmount === null || priceCurrency === null) {
    return null;
  }

  const primary: Money = { amount: priceAmount, currency: priceCurrency };
  if (!rates || rates.ARS.usdRate <= 0 || rates.BRL.usdRate <= 0) {
    return { primary, derived: [] };
  }

  if (priceCurrency === 'ARS') {
    const usd = priceAmount / rates.ARS.usdRate;
    return {
      primary,
      derived: [
        { amount: round2(usd), currency: 'USD' },
        { amount: convert(usd, rates.BRL.usdRate), currency: 'BRL' },
      ],
    };
  }

  return {
    primary,
    derived: [
      { amount: convert(priceAmount, rates.ARS.usdRate), currency: 'ARS' },
      { amount: convert(priceAmount, rates.BRL.usdRate), currency: 'BRL' },
    ],
  };
}
