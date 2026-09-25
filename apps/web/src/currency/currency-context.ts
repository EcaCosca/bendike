import { createContext } from 'react';
import type { Currency } from '@bendike/shared';

export interface CurrencyState {
  currency: Currency | null;
  chosen: boolean;
  setCurrency: (currency: Currency) => void;
}

export const CurrencyContext = createContext<CurrencyState>({
  currency: null,
  chosen: false,
  setCurrency: () => undefined,
});
