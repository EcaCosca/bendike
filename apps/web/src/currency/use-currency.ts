import { useContext } from 'react';
import { CurrencyContext } from './currency-context';

export function useCurrency() {
  return useContext(CurrencyContext);
}
