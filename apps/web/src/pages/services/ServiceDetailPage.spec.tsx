import type { ExchangeRates, ServiceDetail } from '@bendike/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ApiError } from '../../api/http';
import i18n from '../../i18n/i18n';
import * as catalogApi from '../shop/catalog-api';
import { ServiceDetailPage } from './ServiceDetailPage';
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

const detail: ServiceDetail = {
  id: 's1',
  slug: 'reline',
  category: 'reline',
  name: { en: 'Reline', es: 'Cambio de líneas', pt: 'Troca de linhas' },
  summary: { en: 'New lines', es: 'Líneas nuevas', pt: 'Linhas novas' },
  descriptionMd: { en: '# About\n\n- Fast', es: '# Sobre\n\n- Rápido', pt: '' },
  turnaroundNote: { en: '3 days', es: '3 días', pt: '' },
  priceAmount: null,
  priceCurrency: null,
  position: 0,
  active: true,
};

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:locale/services/:slug" element={<ServiceDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ServiceDetailPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    jest.mocked(catalogApi.getExchangeRates).mockResolvedValue(rates);
    jest.mocked(servicesApi.getService).mockResolvedValue(detail);
  });

  test('shows the name, summary, description and turnaround in the current locale', async () => {
    renderAt('/es/services/reline');

    expect(await screen.findByRole('heading', { level: 1, name: 'Cambio de líneas' })).toBeInTheDocument();
    expect(screen.getByText('Líneas nuevas')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sobre' })).toBeInTheDocument();
    expect(screen.getByText(/3 días/)).toBeInTheDocument();
  });

  test('falls back to English for a locale with no translation', async () => {
    renderAt('/pt/services/reline');

    expect(await screen.findByRole('heading', { level: 1, name: 'Troca de linhas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
  });

  test('the Ask on WhatsApp button opens wa.me with the service named in the current locale', async () => {
    await i18n.changeLanguage('es');
    renderAt('/es/services/reline');

    const button = await screen.findByRole('link', { name: 'Consultar por WhatsApp' });
    const url = new URL(button.getAttribute('href') ?? '');
    expect(url.origin + url.pathname).toBe('https://wa.me/5493413955408');
    expect(url.searchParams.get('text')).toBe('Hola Eca, quiero consultar por el servicio: Cambio de líneas.');
    expect(button).toHaveAttribute('target', '_blank');
  });

  test('says the price varies when the service has none', async () => {
    renderAt('/en/services/reline');

    expect(await screen.findByText('Price varies, ask on WhatsApp')).toBeInTheDocument();
  });

  test('omits the turnaround line when there is no note', async () => {
    jest.mocked(servicesApi.getService).mockResolvedValue({ ...detail, turnaroundNote: null });
    renderAt('/en/services/reline');
    await screen.findByRole('heading', { level: 1 });

    expect(screen.queryByText('Turnaround:')).not.toBeInTheDocument();
  });

  test('shows a not-found state with a way back for an unknown slug', async () => {
    jest.mocked(servicesApi.getService).mockRejectedValue(new ApiError(404, 'Not Found'));
    renderAt('/en/services/nope');

    expect(await screen.findByText('Service not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to services' })).toHaveAttribute('href', '/en/services');
  });

  test('shows a load error for other failures', async () => {
    jest.mocked(servicesApi.getService).mockRejectedValue(new ApiError(500, 'boom'));
    renderAt('/en/services/reline');

    expect(await screen.findByText('Could not load the services. Please try again.')).toBeInTheDocument();
  });
});
