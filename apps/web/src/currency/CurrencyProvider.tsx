import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { Currency, Locale } from '@bendike/shared';
import { defaultCurrencyFor } from '@bendike/shared';
import { CurrencyContext, type CurrencyState } from './currency-context';
import { readStoredCurrency, storeCurrency } from './currency-storage';

export function CurrencyProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [picked, setPicked] = useState<Currency | null>(readStoredCurrency);

  const setCurrency = useCallback((currency: Currency) => {
    setPicked(currency);
    storeCurrency(currency);
  }, []);

  const value = useMemo<CurrencyState>(
    () => ({ currency: picked ?? defaultCurrencyFor(locale), chosen: picked !== null, setCurrency }),
    [picked, locale, setCurrency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
