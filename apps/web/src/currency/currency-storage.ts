import type { Currency } from '@bendike/shared';
import { isCurrency } from '@bendike/shared';
import { isAllowed } from '../consent/consent-storage';

export const CURRENCY_KEY = 'bendike.currency';

export function readStoredCurrency(): Currency | null {
  if (!isAllowed('preferences')) {
    return null;
  }
  try {
    const raw = localStorage.getItem(CURRENCY_KEY);
    return isCurrency(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function storeCurrency(currency: Currency): void {
  if (!isAllowed('preferences')) {
    return;
  }
  try {
    localStorage.setItem(CURRENCY_KEY, currency);
  } catch {
    return;
  }
}
