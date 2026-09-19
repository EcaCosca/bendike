import type { Brand, Category, ExchangeRates, Page, ProductSummary } from '@bendike/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '../../i18n/i18n';
import * as catalogApi from './catalog-api';
import { ShopPage } from './ShopPage';

jest.mock('./catalog-api');
jest.mock('../../components/site/SitePage', () => ({
  SitePage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const api = jest.mocked(catalogApi);

const brand: Brand = { id: 'b1', slug: 'squirrel', name: 'Squirrel', websiteUrl: 'https://squirrel.ws', active: true };

const categories: Category[] = [
  {
    id: 'c1',
    slug: 'wingsuits',
    name: { en: 'Wingsuits', es: 'Trajes de alas', pt: 'Wingsuits' },
    parentId: null,
    position: 0,
  },
  {
    id: 'c2',
    slug: 'parachutes',
    name: { en: 'Parachutes', es: 'Paracaídas', pt: 'Paraquedas' },
    parentId: null,
    position: 1,
  },
  {
    id: 'c3',
    slug: 'base-canopies',
    name: { en: 'BASE Canopies', es: 'Velas BASE', pt: 'Velas BASE' },
    parentId: 'c2',
    position: 0,
  },
];

const rates: ExchangeRates = {
  ARS: { currency: 'ARS', usdRate: 1500, source: 't', fetchedAt: '2026-09-17T00:00:00.000Z', manualOverride: false },
  BRL: { currency: 'BRL', usdRate: 5, source: 't', fetchedAt: '2026-09-17T00:00:00.000Z', manualOverride: false },
};

function product(slug: string, name: string): ProductSummary {
  return {
    id: slug,
    slug,
    brand,
    categoryId: 'c1',
    name: { en: name, es: `${name} ES`, pt: `${name} PT` },
    summary: { en: 's', es: 's', pt: 's' },
    listPriceUsd: 1000,
    markupPercent: 20,
    condition: 'new',
    priceAmount: null,
    priceCurrency: null,
    sold: false,
    madeToOrder: false,
    active: true,
    primaryImage: null,
  };
}

function page(items: ProductSummary[], total = items.length, pageNumber = 1): Page<ProductSummary> {
  return { items, page: pageNumber, pageSize: 12, total };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderShop(initialEntry = '/en/shop') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route path="/:locale/shop" element={<ShopPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ShopPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    api.listCategories.mockResolvedValue(categories);
    api.listBrands.mockResolvedValue([brand]);
    api.getExchangeRates.mockResolvedValue(rates);
    api.listProducts.mockResolvedValue(page([product('freak-6', 'Freak 6'), product('swift-5', 'Swift 5')]));
  });

  test('lists the products the API returns and asks for page 1 in the current locale', async () => {
    renderShop('/en/shop');

    expect(await screen.findByText('Freak 6')).toBeInTheDocument();
    expect(screen.getByText('Swift 5')).toBeInTheDocument();
    expect(api.listProducts).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 12, locale: 'en' }));
  });

  test('shows product and category names in the Spanish locale', async () => {
    renderShop('/es/shop');

    expect(await screen.findByText('Freak 6 ES')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trajes de alas' })).toBeInTheDocument();
  });

  test('clicking a category puts it in the URL and refetches filtered by it', async () => {
    const user = userEvent.setup();
    renderShop();
    await screen.findByText('Freak 6');

    await user.click(screen.getByRole('button', { name: 'Wingsuits' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/en/shop?category=wingsuits');
    await waitFor(() =>
      expect(api.listProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ categorySlug: 'wingsuits', page: 1 }),
      ),
    );
  });

  test('changing a filter while on a later page resets to page 1', async () => {
    const user = userEvent.setup();
    api.listProducts.mockResolvedValue(page([product('freak-6', 'Freak 6')], 30, 3));
    renderShop('/en/shop?page=3');
    await screen.findByText('Freak 6');

    await user.click(screen.getByRole('button', { name: 'Wingsuits' }));

    expect(screen.getByTestId('location')).not.toHaveTextContent('page=');
  });

  test('pagination moves to the requested page via the URL', async () => {
    const user = userEvent.setup();
    api.listProducts.mockResolvedValue(page([product('freak-6', 'Freak 6')], 30, 1));
    renderShop();
    await screen.findByText('Freak 6');

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/en/shop?page=2');
  });

  test('submitting a search puts it in the URL', async () => {
    const user = userEvent.setup();
    renderShop();
    await screen.findByText('Freak 6');

    await user.type(screen.getByPlaceholderText('Search products'), 'swift{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('search=swift');
  });

  test('shows an empty state that clears the filters', async () => {
    const user = userEvent.setup();
    api.listProducts.mockResolvedValue(page([], 0));
    renderShop('/en/shop?category=wingsuits&search=nothing');

    expect(await screen.findByText('No products match your filters.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/en\/shop$/);
  });

  test('shows an error message when the products cannot be loaded', async () => {
    api.listProducts.mockRejectedValue(new Error('boom'));
    renderShop();

    expect(await screen.findByText('Could not load the shop. Please try again.')).toBeInTheDocument();
  });

  test('a breadcrumb names the selected category', async () => {
    renderShop('/en/shop?category=base-canopies');
    await screen.findByText('Freak 6');

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('BASE Canopies');
  });

  describe('used gear', () => {
    function usedProduct(slug: string, name: string, sold = false): ProductSummary {
      return {
        ...product(slug, name),
        condition: 'used',
        listPriceUsd: null,
        markupPercent: 0,
        priceAmount: 450000,
        priceCurrency: 'ARS',
        sold,
      };
    }

    test('choosing Used puts the condition in the URL and refetches filtered by it', async () => {
      const user = userEvent.setup();
      renderShop();
      await screen.findByText('Freak 6');

      await user.click(screen.getByRole('combobox', { name: 'Condition' }));
      await user.click(screen.getByRole('option', { name: 'Used' }));

      expect(screen.getByTestId('location')).toHaveTextContent('/en/shop?condition=used');
      await waitFor(() =>
        expect(api.listProducts).toHaveBeenLastCalledWith(expect.objectContaining({ condition: 'used', page: 1 })),
      );
    });

    test('Include sold items adds sold=1 to the URL and asks the API for sold items', async () => {
      const user = userEvent.setup();
      renderShop();
      await screen.findByText('Freak 6');

      await user.click(screen.getByRole('checkbox', { name: 'Include sold items' }));

      expect(screen.getByTestId('location')).toHaveTextContent('sold=1');
      await waitFor(() =>
        expect(api.listProducts).toHaveBeenLastCalledWith(expect.objectContaining({ includeSold: true })),
      );
    });

    test('the condition and sold filters are restored from the URL', async () => {
      renderShop('/en/shop?condition=used&sold=1');
      await screen.findByText('Freak 6');

      expect(screen.getByRole('combobox', { name: 'Condition' })).toHaveTextContent('Used');
      expect(screen.getByRole('checkbox', { name: 'Include sold items' })).toBeChecked();
    });

    test('a used card is labelled Used and shows its own peso price', async () => {
      api.listProducts.mockResolvedValue(page([usedProduct('safire', 'Safire 3')]));
      renderShop();

      expect(await screen.findByText('Safire 3')).toBeInTheDocument();
      expect(screen.getByText('Used')).toBeInTheDocument();
      expect(screen.getByTestId('price-primary')).toHaveTextContent('AR$ 450.000,00');
    });

    test('a sold card carries a Sold badge', async () => {
      api.listProducts.mockResolvedValue(page([usedProduct('safire', 'Safire 3', true)]));
      renderShop('/en/shop?sold=1');

      expect(await screen.findByText('Sold')).toBeInTheDocument();
    });
  });
});
