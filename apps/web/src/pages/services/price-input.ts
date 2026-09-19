import type { PriceCurrency } from '@bendike/shared';

export interface PriceInput {
  priceAmount: number | null;
  priceCurrency: PriceCurrency | null;
}

const THOUSANDS_DOTS = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/;
const PLAIN_DECIMAL = /^\d+([.,]\d{1,2})?$/;

export function parsePriceInput(
  amountText: string,
  currency: PriceCurrency | '',
): PriceInput | 'incomplete' | 'invalid' {
  const text = amountText.trim();

  if (text === '' && currency === '') {
    return { priceAmount: null, priceCurrency: null };
  }
  if (text === '' || currency === '') {
    return 'incomplete';
  }

  let normalised: string;
  if (THOUSANDS_DOTS.test(text)) {
    normalised = text.replace(/\./g, '').replace(',', '.');
  } else if (PLAIN_DECIMAL.test(text)) {
    normalised = text.replace(',', '.');
  } else {
    return 'invalid';
  }

  return { priceAmount: Number(normalised), priceCurrency: currency };
}

export const PRICE_MESSAGES = {
  incomplete: 'Enter both an amount and a currency, or leave both empty.',
  invalid: 'The amount must be a number, for example 55000 or 55.000,50.',
} as const;
