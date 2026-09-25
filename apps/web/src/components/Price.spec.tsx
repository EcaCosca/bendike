import type { ExchangeRates } from '@bendike/shared';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CurrencyContext } from '../currency/currency-context';
import { Price } from './Price';

const rates: ExchangeRates = {
  ARS: { currency: 'ARS', usdRate: 1500, source: 'test', fetchedAt: '2026-09-17T23:01:50.216Z', manualOverride: false },
  BRL: { currency: 'BRL', usdRate: 5, source: 'test', fetchedAt: '2026-09-17T23:01:50.241Z', manualOverride: false },
};

function inCurrency(currency: 'USD' | 'ARS' | 'BRL', children: ReactNode) {
  return (
    <CurrencyContext.Provider value={{ currency, chosen: true, setCurrency: () => undefined }}>
      {children}
    </CurrencyContext.Provider>
  );
}

describe('Price', () => {
  test('shows the marked-up USD price first with ARS and BRL beneath', () => {
    render(<Price listPriceUsd={2090} markupPercent={20} priceAmount={null} priceCurrency={null} rates={rates} />);

    expect(screen.getByTestId('price-primary')).toHaveTextContent('US$ 2,508.00');
    expect(screen.getByTestId('price-primary')).not.toHaveAttribute('data-converted');
    expect(screen.getByTestId('price-local')).toHaveTextContent('AR$ 3.762.000,00');
    expect(screen.getByTestId('price-local')).toHaveTextContent('R$ 12.540,00');
  });

  test('shows only the USD price while exchange rates are not loaded', () => {
    render(<Price listPriceUsd={2090} markupPercent={20} priceAmount={null} priceCurrency={null} rates={null} />);

    expect(screen.getByTestId('price-primary')).toHaveTextContent('US$ 2,508.00');
    expect(screen.queryByTestId('price-local')).not.toBeInTheDocument();
  });

  test('says the price is on request when the product has no price', () => {
    render(<Price listPriceUsd={null} markupPercent={20} priceAmount={null} priceCurrency={null} rates={rates} />);

    expect(screen.getByText('Price on request')).toBeInTheDocument();
    expect(screen.queryByTestId('price-primary')).not.toBeInTheDocument();
  });

  test('a direct peso price is shown as set, with USD and BRL beneath and no markup applied', () => {
    render(<Price listPriceUsd={null} markupPercent={0} priceAmount={450000} priceCurrency="ARS" rates={rates} />);

    expect(screen.getByTestId('price-primary')).toHaveTextContent('AR$ 450.000,00');
    expect(screen.getByTestId('price-local')).toHaveTextContent('US$ 300.00');
    expect(screen.getByTestId('price-local')).toHaveTextContent('R$ 1.500,00');
  });

  test('a direct dollar price is shown as set', () => {
    render(<Price listPriceUsd={null} markupPercent={0} priceAmount={600} priceCurrency="USD" rates={null} />);

    expect(screen.getByTestId('price-primary')).toHaveTextContent('US$ 600.00');
  });

  test('with reais chosen, a catalogue price shows R$ first, marked as converted, with US$ and AR$ beneath', () => {
    render(
      inCurrency(
        'BRL',
        <Price listPriceUsd={2090} markupPercent={20} priceAmount={null} priceCurrency={null} rates={rates} />,
      ),
    );

    const primary = screen.getByTestId('price-primary');
    expect(primary).toHaveTextContent('R$ 12.540,00');
    expect(primary).toHaveAttribute('data-converted', 'true');
    expect(screen.getByTestId('price-local')).toHaveTextContent('US$ 2,508.00 · AR$ 3.762.000,00 · Indicative');
  });

  test('with pesos chosen, a direct peso price is not a conversion', () => {
    render(
      inCurrency(
        'ARS',
        <Price listPriceUsd={null} markupPercent={0} priceAmount={450000} priceCurrency="ARS" rates={rates} />,
      ),
    );

    expect(screen.getByTestId('price-primary')).toHaveTextContent('AR$ 450.000,00');
    expect(screen.getByTestId('price-primary')).not.toHaveAttribute('data-converted');
  });

  test('with a currency chosen but no rates, the entered currency stands alone', () => {
    render(
      inCurrency(
        'BRL',
        <Price listPriceUsd={2090} markupPercent={20} priceAmount={null} priceCurrency={null} rates={null} />,
      ),
    );

    expect(screen.getByTestId('price-primary')).toHaveTextContent('US$ 2,508.00');
    expect(screen.queryByTestId('price-local')).not.toBeInTheDocument();
  });
});
