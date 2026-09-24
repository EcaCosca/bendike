import type { ProductSummary } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ApiError } from '../../api/http';
import { clearConsent, readConsent, writeConsent } from '../../consent/consent-storage';
import { ConsentProvider } from '../../consent/ConsentProvider';
import i18n from '../../i18n/i18n';
import * as catalogApi from '../shop/catalog-api';
import * as learnApi from './learn-api';
import { learnItem, learnSummary } from './learn-fixtures';
import { LearnItemPage } from './LearnItemPage';

jest.mock('./learn-api');
jest.mock('../shop/catalog-api');
jest.mock('../../components/site/SitePage', () => ({
  SitePage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const api = jest.mocked(learnApi);
const shop = jest.mocked(catalogApi);

const video = learnItem('vigil-cuatro-battery', {
  title: { en: 'Changing the Cuatro battery', es: 'Cambio de batería del Cuatro', pt: 'Troca da bateria' },
  author: 'Vigil',
  embed: { provider: 'youtube', id: 'dQw4w9WgXcQ', kind: 'video' },
  thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  topics: ['aad', 'gear_care'],
  links: [{ kind: 'brand', targetId: 'brand-vigil' }],
});

const product: ProductSummary = {
  id: 'p1',
  slug: 'vigil-cuatro',
  brand: { id: 'brand-vigil', slug: 'vigil', name: 'Vigil', websiteUrl: 'https://vigil.aero', active: true },
  categoryId: 'c1',
  name: { en: 'Vigil Cuatro', es: 'Vigil Cuatro', pt: 'Vigil Cuatro' },
  summary: { en: 's', es: 's', pt: 's' },
  listPriceUsd: 1800,
  markupPercent: 20,
  condition: 'new',
  priceAmount: null,
  priceCurrency: null,
  sold: false,
  madeToOrder: false,
  active: true,
  primaryImage: null,
};

function renderItem(path = '/en/learn/vigil-cuatro-battery') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ConsentProvider>
        <Routes>
          <Route path="/:locale/learn/:slug" element={<LearnItemPage />} />
        </Routes>
      </ConsentProvider>
    </MemoryRouter>,
  );
}

describe('LearnItemPage', () => {
  beforeEach(async () => {
    clearConsent();
    await i18n.changeLanguage('en');
    api.getLearnItem.mockResolvedValue(video);
    api.listRelatedLearnItems.mockResolvedValue([learnSummary('aad-modes'), learnSummary('aad-service')]);
    shop.listProducts.mockResolvedValue({ items: [product], page: 1, pageSize: 48, total: 1 });
    shop.getExchangeRates.mockRejectedValue(new Error('no rates'));
  });
  afterEach(() => clearConsent());

  test('keeps the player off until the visitor allows third-party services, then loads the privacy domain', async () => {
    const user = userEvent.setup();
    renderItem();

    expect(await screen.findByRole('heading', { level: 1, name: 'Changing the Cuatro battery' })).toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.getByText(/The player loads from YouTube/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Play here (loads YouTube)' }));

    const frame = document.querySelector('iframe');
    expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(frame).toHaveAttribute('title', 'Changing the Cuatro battery');
    expect(readConsent()?.thirdParty).toBe(true);
    expect(screen.queryByTestId('embed-poster')).not.toBeInTheDocument();
  });

  test('shows the player straight away when third-party services were already allowed', async () => {
    writeConsent({ preferences: false, thirdParty: true });
    renderItem();

    await screen.findByRole('heading', { level: 1 });
    expect(document.querySelector('iframe')).toHaveAttribute('src', expect.stringContaining('youtube-nocookie.com'));
  });

  test('links out to the source, shares by WhatsApp with the title, and lists related shop items and topics', async () => {
    await i18n.changeLanguage('es');
    renderItem('/es/learn/vigil-cuatro-battery');

    await screen.findByRole('heading', { level: 1, name: 'Cambio de batería del Cuatro' });
    expect(screen.getByRole('link', { name: /Abrir en la fuente/ })).toHaveAttribute('href', video.url);
    const share = screen.getByRole('link', { name: /Compartir por WhatsApp/ });
    expect(share.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(share.getAttribute('href') ?? '')).toContain('Cambio de batería del Cuatro');
    for (const link of screen.getAllByRole('link', { name: 'AAD' })) {
      expect(link).toHaveAttribute('href', '/es/learn?topic=aad');
    }

    const shopSection = await screen.findByRole('region', { name: 'Relacionado en la tienda' });
    expect(within(shopSection).getByRole('link', { name: /Vigil Cuatro/ })).toHaveAttribute(
      'href',
      '/es/shop/vigil-cuatro',
    );
    const more = screen.getByRole('region', { name: 'Más sobre este tema' });
    expect(within(more).getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByRole('link', { name: /Comprar/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Asociado de Amazon/)).not.toBeInTheDocument();
  });

  test('a book with an affiliate buy link gets a sponsored Buy button and the disclosure', async () => {
    api.getLearnItem.mockResolvedValue(
      learnItem('the-parachute-and-its-pilot', {
        format: 'book',
        url: 'https://www.bigairsportz.com/',
        buyUrl: 'https://www.amazon.com/dp/0977627705?tag=bendike-20',
        affiliate: true,
      }),
    );
    api.listRelatedLearnItems.mockResolvedValue([]);
    renderItem('/en/learn/the-parachute-and-its-pilot');

    const buy = await screen.findByRole('link', { name: /Buy/ });
    expect(buy).toHaveAttribute('href', 'https://www.amazon.com/dp/0977627705?tag=bendike-20');
    expect(buy).toHaveAttribute('rel', expect.stringContaining('sponsored'));
    expect(buy).toHaveAttribute('target', '_blank');
    expect(screen.getByText('As an Amazon Associate, Bendike earns from qualifying purchases.')).toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
    expect(shop.listProducts).not.toHaveBeenCalled();
  });

  test('shows the not-found state with a way back when the slug is unknown', async () => {
    api.getLearnItem.mockRejectedValue(new ApiError(404, 'not found'));
    api.listRelatedLearnItems.mockRejectedValue(new ApiError(404, 'not found'));
    await i18n.changeLanguage('pt');
    renderItem('/pt/learn/nope');

    expect(await screen.findByRole('heading', { name: 'Não encontrado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para Aprender' })).toHaveAttribute('href', '/pt/learn');
    await waitFor(() => expect(api.getLearnItem).toHaveBeenCalledWith('nope'));
  });
});
