import type { ExchangeRates, ServiceSummary } from '@bendike/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../i18n/i18n';
import * as catalogApi from '../shop/catalog-api';
import { ServicesPage } from './ServicesPage';
import * as servicesApi from './services-api';

jest.mock('../shop/catalog-api');
jest.mock('./services-api');
jest.mock('../../components/site/SitePage', () => ({
  SitePage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const rates: ExchangeRates = {
  ARS: { currency: 'ARS', usdRate: 1500, source: 't', fetchedAt: '2026-09-18T00:00:00.000Z', manualOverride: false },
  BRL: { currency: 'BRL', usdRate: 5, source: 't', fetchedAt: '2026-09-18T00:00:00.000Z', manualOverride: false },
};

function service(slug: string, en: string, es: string, priceAmount: number | null): ServiceSummary {
  return {
    id: slug,
    slug,
    category: 'repack',
    name: { en, es, pt: en },
    summary: { en: `${en} summary`, es: `${es} resumen`, pt: '' },
    priceAmount,
    priceCurrency: priceAmount === null ? null : 'ARS',
    position: 0,
    active: true,
  };
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:locale/services" element={<ServicesPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ServicesPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    jest.mocked(catalogApi.getExchangeRates).mockResolvedValue(rates);
    jest
      .mocked(servicesApi.listServices)
      .mockResolvedValue([
        service('repack', 'Reserve repack', 'Plegado de reserva', 55000),
        service('reline', 'Reline', 'Cambio de líneas', null),
      ]);
  });

  test('lists each service with its summary, a priced one showing pesos and an unpriced one saying it varies', async () => {
    renderAt('/en/services');

    expect(await screen.findByRole('heading', { name: 'Reserve repack' })).toBeInTheDocument();
    expect(screen.getByText('Reserve repack summary')).toBeInTheDocument();
    expect(await screen.findByTestId('service-price')).toHaveTextContent('AR$ 55.000,00');
    expect(screen.getByText('Price varies, ask on WhatsApp')).toBeInTheDocument();
  });

  test('shows the Spanish copy on the Spanish route and links to the Spanish detail page', async () => {
    renderAt('/es/services');

    const link = await screen.findByRole('link', { name: /Plegado de reserva/ });
    expect(link).toHaveAttribute('href', '/es/services/repack');
    expect(screen.getByText('Plegado de reserva resumen')).toBeInTheDocument();
  });

  test('shows an empty message when there are no services', async () => {
    jest.mocked(servicesApi.listServices).mockResolvedValue([]);
    renderAt('/en/services');

    expect(await screen.findByText('No services are listed yet.')).toBeInTheDocument();
  });

  test('shows an error when the services cannot be loaded', async () => {
    jest.mocked(servicesApi.listServices).mockRejectedValue(new Error('boom'));
    renderAt('/en/services');

    expect(await screen.findByText('Could not load the services. Please try again.')).toBeInTheDocument();
  });
});
