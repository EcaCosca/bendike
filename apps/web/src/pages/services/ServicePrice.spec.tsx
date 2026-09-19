import type { ExchangeRates } from '@bendike/shared';
import { render, screen } from '@testing-library/react';
import i18n from '../../i18n/i18n';
import { ServicePrice } from './ServicePrice';

const rates: ExchangeRates = {
  ARS: { currency: 'ARS', usdRate: 1500, source: 't', fetchedAt: '2026-09-18T00:00:00.000Z', manualOverride: false },
  BRL: { currency: 'BRL', usdRate: 5, source: 't', fetchedAt: '2026-09-18T00:00:00.000Z', manualOverride: false },
};

describe('ServicePrice', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  test('shows a peso price first with USD and BRL beneath', () => {
    render(<ServicePrice priceAmount={75000} priceCurrency="ARS" rates={rates} />);

    expect(screen.getByTestId('service-price')).toHaveTextContent('AR$ 75.000,00');
    expect(screen.getByTestId('service-price-derived')).toHaveTextContent('US$ 50.00');
    expect(screen.getByTestId('service-price-derived')).toHaveTextContent('R$ 250,00');
  });

  test('shows only the peso price while rates are not loaded', () => {
    render(<ServicePrice priceAmount={75000} priceCurrency="ARS" rates={null} />);

    expect(screen.getByTestId('service-price')).toHaveTextContent('AR$ 75.000,00');
    expect(screen.queryByTestId('service-price-derived')).not.toBeInTheDocument();
  });

  test('says the price varies when the service has none', () => {
    render(<ServicePrice priceAmount={null} priceCurrency={null} rates={rates} />);

    expect(screen.getByText('Price varies, ask on WhatsApp')).toBeInTheDocument();
    expect(screen.queryByTestId('service-price')).not.toBeInTheDocument();
  });

  test('the "varies" message follows the current language', async () => {
    await i18n.changeLanguage('es');
    render(<ServicePrice priceAmount={null} priceCurrency={null} rates={rates} />);

    expect(screen.getByText('Precio variable, consultá por WhatsApp')).toBeInTheDocument();
  });
});
