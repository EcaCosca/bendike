import type { ExchangeRates } from './catalog';
import {
  bendikePriceUsd,
  convert,
  defaultCurrencyFor,
  displayFigures,
  formatMoney,
  isCurrency,
  priceFigures,
} from './pricing';

describe('bendikePriceUsd', () => {
  test('adds the markup percentage to the list price', () => {
    expect(bendikePriceUsd(2090, 20)).toBe(2508);
  });

  test('rounds to two decimals', () => {
    expect(bendikePriceUsd(99.99, 20)).toBeCloseTo(119.99, 2);
  });

  test('a zero markup returns the list price unchanged', () => {
    expect(bendikePriceUsd(150, 0)).toBe(150);
  });
});

describe('convert', () => {
  test('multiplies the USD amount by the rate and rounds to two decimals', () => {
    expect(convert(100, 1234.5678)).toBe(123456.78);
  });

  test('a rate of 1 returns the same amount', () => {
    expect(convert(2508, 1)).toBe(2508);
  });
});

describe('formatMoney', () => {
  test('formats USD with the en-US locale', () => {
    expect(formatMoney(2508, 'USD')).toBe('US$\u00a02,508.00');
  });

  test('formats ARS with the es-AR locale', () => {
    expect(formatMoney(1234567, 'ARS')).toBe('AR$\u00a01.234.567,00');
  });

  test('formats BRL with the pt-BR locale', () => {
    expect(formatMoney(1234.5, 'BRL')).toBe('R$\u00a01.234,50');
  });
});

const rates: ExchangeRates = {
  ARS: { currency: 'ARS', usdRate: 1500, source: 't', fetchedAt: '2026-09-18T00:00:00.000Z', manualOverride: false },
  BRL: { currency: 'BRL', usdRate: 5, source: 't', fetchedAt: '2026-09-18T00:00:00.000Z', manualOverride: false },
};

describe('priceFigures', () => {
  test('a peso price is primary, with USD and BRL derived from the rates', () => {
    expect(priceFigures(75000, 'ARS', rates)).toEqual({
      primary: { amount: 75000, currency: 'ARS' },
      derived: [
        { amount: 50, currency: 'USD' },
        { amount: 250, currency: 'BRL' },
      ],
    });
  });

  test('a dollar price is primary, with ARS and BRL derived from the rates', () => {
    expect(priceFigures(40, 'USD', rates)).toEqual({
      primary: { amount: 40, currency: 'USD' },
      derived: [
        { amount: 60000, currency: 'ARS' },
        { amount: 200, currency: 'BRL' },
      ],
    });
  });

  test('without rates only the primary figure is returned', () => {
    expect(priceFigures(75000, 'ARS', null)).toEqual({ primary: { amount: 75000, currency: 'ARS' }, derived: [] });
  });

  test('a rate of zero (not fetched yet) is treated as no rates', () => {
    const missing: ExchangeRates = { ARS: { ...rates.ARS, usdRate: 0 }, BRL: { ...rates.BRL, usdRate: 0 } };

    expect(priceFigures(75000, 'ARS', missing)?.derived).toEqual([]);
  });

  test('no price means no figures', () => {
    expect(priceFigures(null, null, rates)).toBeNull();
  });
});

describe('defaultCurrencyFor', () => {
  test.each([
    ['en', 'USD'],
    ['es', 'ARS'],
    ['pt', 'BRL'],
  ] as const)('%s shows %s first', (locale, currency) => {
    expect(defaultCurrencyFor(locale)).toBe(currency);
  });
});

describe('isCurrency', () => {
  test('accepts the three display currencies and nothing else', () => {
    expect(isCurrency('BRL')).toBe(true);
    expect(isCurrency('EUR')).toBe(false);
    expect(isCurrency(null)).toBe(false);
  });
});

describe('displayFigures', () => {
  test('a dollar price shown in reais: R$ first, then US$ and AR$, marked as converted', () => {
    expect(displayFigures({ amount: 40, currency: 'USD' }, rates, 'BRL')).toEqual({
      primary: { amount: 200, currency: 'BRL' },
      derived: [
        { amount: 40, currency: 'USD' },
        { amount: 60000, currency: 'ARS' },
      ],
      primaryConverted: true,
    });
  });

  test('a peso price shown in dollars goes through the peso rate', () => {
    expect(displayFigures({ amount: 75000, currency: 'ARS' }, rates, 'USD')).toEqual({
      primary: { amount: 50, currency: 'USD' },
      derived: [
        { amount: 75000, currency: 'ARS' },
        { amount: 250, currency: 'BRL' },
      ],
      primaryConverted: true,
    });
  });

  test('a peso price shown in reais converts through dollars', () => {
    expect(displayFigures({ amount: 75000, currency: 'ARS' }, rates, 'BRL').primary).toEqual({
      amount: 250,
      currency: 'BRL',
    });
  });

  test('showing the entered currency is not a conversion and keeps the exact amount', () => {
    const figures = displayFigures({ amount: 40.005, currency: 'USD' }, rates, 'USD');

    expect(figures.primary).toEqual({ amount: 40.005, currency: 'USD' });
    expect(figures.primaryConverted).toBe(false);
  });

  test('without usable rates the entered figure stands alone whatever currency was asked for', () => {
    expect(displayFigures({ amount: 75000, currency: 'ARS' }, null, 'BRL')).toEqual({
      primary: { amount: 75000, currency: 'ARS' },
      derived: [],
      primaryConverted: false,
    });
  });
});
