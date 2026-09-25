import type { ExchangeRates } from './catalog';
import type { Locale } from './locale';

export const DISPLAY_CURRENCIES = ['USD', 'ARS', 'BRL'] as const;

export type Currency = (typeof DISPLAY_CURRENCIES)[number];

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (DISPLAY_CURRENCIES as readonly string[]).includes(value);
}

export const PRICE_CURRENCIES = ['ARS', 'USD'] as const;

export type PriceCurrency = (typeof PRICE_CURRENCIES)[number];

const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: 'en-US',
  ARS: 'es-AR',
  BRL: 'pt-BR',
};

const DEFAULT_CURRENCY_FOR_LOCALE: Record<Locale, Currency> = {
  en: 'USD',
  es: 'ARS',
  pt: 'BRL',
};

export function defaultCurrencyFor(locale: Locale): Currency {
  return DEFAULT_CURRENCY_FOR_LOCALE[locale];
}

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

export interface DisplayFigures extends PriceFigures {
  primaryConverted: boolean;
}

function ratesUsable(rates: ExchangeRates | null): rates is ExchangeRates {
  return rates !== null && rates.ARS.usdRate > 0 && rates.BRL.usdRate > 0;
}

function toUsd(money: Money, rates: ExchangeRates): number {
  return money.currency === 'USD' ? money.amount : money.amount / rates[money.currency].usdRate;
}

function fromUsd(amountUsd: number, currency: Currency, rates: ExchangeRates): number {
  return currency === 'USD' ? round2(amountUsd) : convert(amountUsd, rates[currency].usdRate);
}

export function displayFigures(entered: Money, rates: ExchangeRates | null, display: Currency): DisplayFigures {
  if (!ratesUsable(rates)) {
    return { primary: entered, derived: [], primaryConverted: false };
  }
  const usd = toUsd(entered, rates);
  const inCurrency = (currency: Currency): Money =>
    currency === entered.currency ? entered : { amount: fromUsd(usd, currency, rates), currency };
  return {
    primary: inCurrency(display),
    derived: DISPLAY_CURRENCIES.filter((currency) => currency !== display).map(inCurrency),
    primaryConverted: display !== entered.currency,
  };
}

export function priceFigures(
  priceAmount: number | null,
  priceCurrency: PriceCurrency | null,
  rates: ExchangeRates | null,
): PriceFigures | null {
  if (priceAmount === null || priceCurrency === null) {
    return null;
  }
  const { primary, derived } = displayFigures({ amount: priceAmount, currency: priceCurrency }, rates, priceCurrency);
  return { primary, derived };
}
