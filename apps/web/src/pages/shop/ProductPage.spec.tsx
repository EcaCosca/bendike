import type {
  Brand,
  Category,
  ExchangeRates,
  Page,
  ProductDetail,
  ProductSummary,
  ProductVariant,
} from '@bendike/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ApiError } from '../../api/http';
import i18n from '../../i18n/i18n';
import * as catalogApi from './catalog-api';
import { ProductPage } from './ProductPage';

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
];

const rates: ExchangeRates = {
  ARS: { currency: 'ARS', usdRate: 1500, source: 't', fetchedAt: '2026-09-17T00:00:00.000Z', manualOverride: false },
  BRL: { currency: 'BRL', usdRate: 5, source: 't', fetchedAt: '2026-09-17T00:00:00.000Z', manualOverride: false },
};

function variant(id: string, optionValues: string[], listPriceUsd: number | null = null): ProductVariant {
  return { id, sku: `SKU-${id}`, optionNames: ['size', 'color'], optionValues, listPriceUsd, active: true };
}

const detail: ProductDetail = {
  id: 'p1',
  slug: 'freak-6',
  brand,
  categoryId: 'c1',
  name: { en: 'Freak 6', es: 'Freak Seis', pt: 'Freak 6' },
  summary: { en: 'Less drag', es: 'Menos resistencia', pt: '' },
  descriptionMd: { en: '# Details\n\n- Fast', es: '# Detalles\n\n- Rápido', pt: '' },
  listPriceUsd: 2000,
  markupPercent: 20,
  condition: 'new',
  priceAmount: null,
  priceCurrency: null,
  sold: false,
  madeToOrder: true,
  active: true,
  primaryImage: null,
  images: [
    { id: 'i1', url: 'https://cdn.example/1.jpg', alt: 'front', position: 0 },
    { id: 'i2', url: 'https://cdn.example/2.jpg', alt: 'back', position: 1 },
  ],
  variants: [variant('m-red', ['M', 'red'], 2500), variant('m-blue', ['M', 'blue']), variant('l-red', ['L', 'red'])],
};

function related(slug: string): ProductSummary {
  return {
    id: slug,
    slug,
    brand,
    categoryId: 'c1',
    name: { en: slug, es: slug, pt: slug },
    summary: { en: '', es: '', pt: '' },
    listPriceUsd: 100,
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

function renderProduct(path = '/en/shop/freak-6') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:locale/shop/:slug" element={<ProductPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProductPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    api.getProduct.mockResolvedValue(detail);
    api.listCategories.mockResolvedValue(categories);
    api.getExchangeRates.mockResolvedValue(rates);
    const relatedPage: Page<ProductSummary> = {
      items: [related('freak-6'), related('swift-5'), related('sprint')],
      page: 1,
      pageSize: 5,
      total: 3,
    };
    api.listProducts.mockResolvedValue(relatedPage);
  });

  test('shows the name, summary and description in the current locale', async () => {
    renderProduct('/es/shop/freak-6');

    expect(await screen.findByRole('heading', { level: 1, name: 'Freak Seis' })).toBeInTheDocument();
    expect(screen.getByText('Menos resistencia')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Detalles' })).toBeInTheDocument();
  });

  test('falls back to English for a field with no translation', async () => {
    renderProduct('/pt/shop/freak-6');

    expect(await screen.findByText('Less drag')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument();
  });

  test('says the product is made to order', async () => {
    renderProduct();

    expect(await screen.findByText('Made to order: not kept in stock.')).toBeInTheDocument();
  });

  test('shows the product price and asks for every option until a variant is chosen', async () => {
    renderProduct();

    expect(await screen.findByText('Choose every option to see the exact price.')).toBeInTheDocument();
    expect(screen.getAllByTestId('price-usd')[0]).toHaveTextContent('US$ 2,400.00');
  });

  test('choosing every option narrows to one variant and shows its own price', async () => {
    const user = userEvent.setup();
    renderProduct();
    await screen.findByRole('heading', { level: 1 });

    await user.click(screen.getByRole('combobox', { name: 'Size' }));
    await user.click(screen.getByRole('option', { name: 'M' }));
    await user.click(screen.getByRole('combobox', { name: 'Color' }));
    await user.click(screen.getByRole('option', { name: 'red' }));

    expect(screen.getAllByTestId('price-usd')[0]).toHaveTextContent('US$ 3,000.00');
    expect(screen.getByText('SKU SKU-m-red')).toBeInTheDocument();
    expect(screen.queryByText('Choose every option to see the exact price.')).not.toBeInTheDocument();
  });

  test('later options stay disabled until the earlier one is chosen', async () => {
    renderProduct();
    await screen.findByRole('heading', { level: 1 });

    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveAttribute('aria-disabled', 'true');
  });

  test('clicking a thumbnail changes the main image', async () => {
    const user = userEvent.setup();
    renderProduct();
    await screen.findByRole('heading', { level: 1 });

    expect(screen.getByRole('img', { name: 'front' })).toHaveAttribute('src', 'https://cdn.example/1.jpg');
    await user.click(screen.getByRole('button', { name: 'Show image 2' }));

    expect(screen.getByTestId('main-image')).toHaveAttribute('src', 'https://cdn.example/2.jpg');
  });

  test('lists related products from the same category, excluding this one', async () => {
    renderProduct();

    expect(await screen.findByText('swift-5')).toBeInTheDocument();
    expect(screen.getByText('sprint')).toBeInTheDocument();
    expect(screen.queryByText('freak-6')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(api.listProducts).toHaveBeenCalledWith(expect.objectContaining({ categorySlug: 'wingsuits' })),
    );
  });

  test('shows a not-found state with a link back to the shop for an unknown slug', async () => {
    api.getProduct.mockRejectedValue(new ApiError(404, 'Not Found'));
    renderProduct('/en/shop/nope');

    expect(await screen.findByText('Product not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the shop' })).toHaveAttribute('href', '/en/shop');
  });

  test('shows a load error for other failures', async () => {
    api.getProduct.mockRejectedValue(new ApiError(500, 'boom'));
    renderProduct();

    expect(await screen.findByText('Could not load this product. Please try again.')).toBeInTheDocument();
  });

  describe('used gear', () => {
    const used: ProductDetail = {
      ...detail,
      name: { en: 'Icarus Safire 3', es: 'Icarus Safire 3', pt: 'Icarus Safire 3' },
      condition: 'used',
      listPriceUsd: null,
      markupPercent: 0,
      priceAmount: 450000,
      priceCurrency: 'ARS',
      madeToOrder: false,
      variants: [],
    };

    test('shows the Used label and the price in the currency it was set in', async () => {
      api.getProduct.mockResolvedValue(used);
      renderProduct();

      expect(await screen.findByRole('heading', { level: 1, name: 'Icarus Safire 3' })).toBeInTheDocument();
      expect(screen.getByText('Used')).toBeInTheDocument();
      expect(screen.getAllByTestId('price-primary')[0]).toHaveTextContent('AR$ 450.000,00');
    });

    test('offers an Ask on WhatsApp button that names the item in the visitor locale', async () => {
      await i18n.changeLanguage('es');
      api.getProduct.mockResolvedValue(used);
      renderProduct('/es/shop/freak-6');

      const button = await screen.findByRole('link', { name: 'Consultar por WhatsApp' });
      const url = new URL(button.getAttribute('href') ?? '');
      expect(url.origin + url.pathname).toBe('https://wa.me/5493413955408');
      expect(url.searchParams.get('text')).toBe('Hola Eca, me interesa este artículo usado: Icarus Safire 3.');
    });

    test('a sold item says so and offers no contact button', async () => {
      api.getProduct.mockResolvedValue({ ...used, sold: true });
      renderProduct();

      expect(await screen.findByText('This item has been sold.')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Ask on WhatsApp' })).not.toBeInTheDocument();
    });

    test('a new product has no contact button', async () => {
      renderProduct();
      await screen.findByRole('heading', { level: 1 });

      expect(screen.queryByRole('link', { name: 'Ask on WhatsApp' })).not.toBeInTheDocument();
    });
  });
});
