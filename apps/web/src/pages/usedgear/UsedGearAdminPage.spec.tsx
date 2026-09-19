import { Role, type Brand, type Category, type UsedItemAdminDetail } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as catalogApi from '../shop/catalog-api';
import * as adminApi from './used-gear-admin-api';
import { UsedGearAdminPage } from './UsedGearAdminPage';

jest.mock('../../auth/use-auth');
jest.mock('../shop/catalog-api');
jest.mock('./used-gear-admin-api');

const api = jest.mocked(adminApi);
const catalog = jest.mocked(catalogApi);

const text = (value: string) => ({ en: value, es: `${value} ES`, pt: `${value} PT` });
const icarus: Brand = { id: 'b1', slug: 'icarus', name: 'Icarus', websiteUrl: '', active: true };
const categories: Category[] = [
  { id: 'c1', slug: 'skydiving-canopies', name: text('Skydiving Canopies'), parentId: null, position: 0 },
  { id: 'c2', slug: 'containers', name: text('Containers'), parentId: null, position: 1 },
];

function item(overrides: Partial<UsedItemAdminDetail> = {}): UsedItemAdminDetail {
  return {
    id: 'u1',
    slug: 'safire-3',
    brand: icarus,
    categoryId: 'c1',
    name: text('Safire 3'),
    summary: text('Main canopy'),
    descriptionMd: text('About 300 jumps'),
    listPriceUsd: null,
    markupPercent: 0,
    condition: 'used',
    priceAmount: 450000,
    priceCurrency: 'ARS',
    sold: false,
    madeToOrder: false,
    active: true,
    primaryImage: null,
    images: [{ id: 'i1', url: '/uploads/products/a.jpg', alt: 'a', position: 0 }],
    variants: [],
    translationOverrides: {},
    soldAt: null,
    ...overrides,
  };
}

function renderPage() {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'a',
      email: 'a@b.c',
      displayName: 'Eca',
      role: Role.Admin,
      authMethods: ['password'],
      phone: null,
      locale: 'es',
      createdAt: '2026-09-19T00:00:00.000Z',
    },
    token: 'token-1',
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
  });
  render(
    <MemoryRouter>
      <UsedGearAdminPage />
    </MemoryRouter>,
  );
}

describe('UsedGearAdminPage', () => {
  beforeEach(() => {
    api.listUsedItems.mockResolvedValue([
      item(),
      item({ id: 'u2', name: text('Wings Container'), sold: true, priceAmount: 700, priceCurrency: 'USD' }),
    ]);
    catalog.listBrands.mockResolvedValue([icarus]);
    catalog.listCategories.mockResolvedValue(categories);
  });

  test('lists every used item with its price and whether it is listed or sold', async () => {
    renderPage();

    expect(await screen.findByText('Safire 3')).toBeInTheDocument();
    expect(screen.getByText('AR$ 450.000,00')).toBeInTheDocument();
    expect(screen.getByText('US$ 700.00')).toBeInTheDocument();
    expect(screen.getByText('Listed', { selector: '.MuiChip-label' })).toBeInTheDocument();
    expect(screen.getByText('Sold', { selector: '.MuiChip-label' })).toBeInTheDocument();
  });

  test('the sold switch marks an item sold', async () => {
    const user = userEvent.setup();
    api.updateUsedItem.mockResolvedValue(item({ sold: true }));
    renderPage();
    await screen.findByText('Safire 3');

    await user.click(screen.getByRole('switch', { name: 'Sold: Safire 3' }));

    expect(api.updateUsedItem).toHaveBeenCalledWith('token-1', 'u1', { sold: true });
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Sold: Safire 3' })).toBeChecked());
  });

  test('shows the error when a change fails', async () => {
    const user = userEvent.setup();
    api.updateUsedItem.mockRejectedValue(new Error('Forbidden'));
    renderPage();
    await screen.findByText('Safire 3');

    await user.click(screen.getByRole('switch', { name: 'Sold: Safire 3' }));

    expect(await screen.findByText('Forbidden')).toBeInTheDocument();
  });

  describe('adding an item', () => {
    async function openCreate() {
      const user = userEvent.setup();
      renderPage();
      await screen.findByText('Safire 3');
      await user.click(screen.getByRole('button', { name: 'Add used item' }));
      return { user, dialog: within(await screen.findByRole('dialog')) };
    }

    async function fillBasics(user: ReturnType<typeof userEvent.setup>, dialog: ReturnType<typeof within>) {
      await user.type(dialog.getByLabelText(/^Name/), 'Vector 3');
      await user.type(dialog.getByLabelText(/^Summary/), 'Used container');
      await user.type(dialog.getByLabelText(/^Description/), 'Good condition');
      await user.click(dialog.getByRole('combobox', { name: /^Category/ }));
      await user.click(screen.getByRole('option', { name: 'Containers' }));
      await user.type(dialog.getByLabelText(/Price amount/), '900.000');
      await user.click(dialog.getByRole('combobox', { name: /Currency/ }));
      await user.click(screen.getByRole('option', { name: 'ARS' }));
    }

    test('creates the item with an existing brand, uploads the chosen photos, and lists it', async () => {
      api.createUsedItem.mockResolvedValue(item({ id: 'u3', name: text('Vector 3') }));
      api.uploadProductImages.mockResolvedValue([]);
      api.listUsedItems.mockResolvedValueOnce([item()]).mockResolvedValue([
        item(),
        item({
          id: 'u3',
          name: text('Vector 3'),
          images: [{ id: 'i1', url: '/uploads/products/front.jpg', alt: '', position: 0 }],
        }),
      ]);
      const { user, dialog } = await openCreate();
      await fillBasics(user, dialog);
      await user.click(dialog.getByRole('combobox', { name: /^Brand/ }));
      await user.click(screen.getByRole('option', { name: 'Icarus' }));
      const photo = new File(['bytes'], 'front.jpg', { type: 'image/jpeg' });
      await user.upload(dialog.getByLabelText('Photos'), photo);
      await user.click(dialog.getByRole('button', { name: 'Create item' }));

      expect(api.createUsedItem).toHaveBeenCalledWith('token-1', {
        name: 'Vector 3',
        summary: 'Used container',
        descriptionMd: 'Good condition',
        brandId: 'b1',
        categoryId: 'c2',
        priceAmount: 900000,
        priceCurrency: 'ARS',
      });
      expect(api.uploadProductImages).toHaveBeenCalledWith('token-1', 'u3', [photo]);
      expect(await screen.findByText('Vector 3')).toBeInTheDocument();
      await waitFor(() => expect(document.querySelector('img[src="/uploads/products/front.jpg"]')).toBeInTheDocument());
    });

    test('a brand that is not in the list is created first and used for the item', async () => {
      api.createBrand.mockResolvedValue({
        id: 'b9',
        slug: 'ram-air-co',
        name: 'Ram Air Co',
        websiteUrl: '',
        active: true,
      });
      api.createUsedItem.mockResolvedValue(item({ id: 'u4' }));
      const { user, dialog } = await openCreate();
      await fillBasics(user, dialog);
      await user.click(dialog.getByRole('combobox', { name: /^Brand/ }));
      await user.click(screen.getByRole('option', { name: 'Add a new brand…' }));
      await user.type(dialog.getByLabelText(/New brand name/), 'Ram Air Co');
      await user.click(dialog.getByRole('button', { name: 'Create item' }));

      expect(api.createBrand).toHaveBeenCalledWith('token-1', { slug: 'ram-air-co', name: 'Ram Air Co' });
      expect(api.createUsedItem).toHaveBeenCalledWith('token-1', expect.objectContaining({ brandId: 'b9' }));
    });

    test('a used item needs a price, so a missing one is refused before any request', async () => {
      const { user, dialog } = await openCreate();
      await user.type(dialog.getByLabelText(/^Name/), 'X');
      await user.type(dialog.getByLabelText(/^Summary/), 'x');
      await user.type(dialog.getByLabelText(/^Description/), 'x');
      await user.click(dialog.getByRole('combobox', { name: /^Brand/ }));
      await user.click(screen.getByRole('option', { name: 'Icarus' }));
      await user.click(dialog.getByRole('combobox', { name: /^Category/ }));
      await user.click(screen.getByRole('option', { name: 'Containers' }));
      await user.click(dialog.getByRole('button', { name: 'Create item' }));

      expect(await dialog.findByText('Enter a price and choose a currency.')).toBeInTheDocument();
      expect(api.createUsedItem).not.toHaveBeenCalled();
    });

    test('shows the API error and keeps the dialog open', async () => {
      api.createUsedItem.mockRejectedValue(new Error('Brand b1 does not exist'));
      const { user, dialog } = await openCreate();
      await fillBasics(user, dialog);
      await user.click(dialog.getByRole('combobox', { name: /^Brand/ }));
      await user.click(screen.getByRole('option', { name: 'Icarus' }));
      await user.click(dialog.getByRole('button', { name: 'Create item' }));

      expect(await dialog.findByText('Brand b1 does not exist')).toBeInTheDocument();
    });
  });

  describe('editing an item', () => {
    async function openEdit() {
      const user = userEvent.setup();
      renderPage();
      await screen.findByText('Safire 3');
      await user.click(screen.getByRole('button', { name: 'Edit Safire 3' }));
      return { user, dialog: within(await screen.findByRole('dialog')) };
    }

    test('changing the price saves amount and currency', async () => {
      api.updateUsedItem.mockResolvedValue(item({ priceAmount: 400000 }));
      const { user, dialog } = await openEdit();

      const amount = dialog.getByLabelText(/Price amount/);
      await user.clear(amount);
      await user.type(amount, '400.000');
      await user.click(dialog.getByRole('button', { name: 'Save details' }));

      expect(api.updateUsedItem).toHaveBeenCalledWith(
        'token-1',
        'u1',
        expect.objectContaining({
          priceAmount: 400000,
          priceCurrency: 'ARS',
          brandId: 'b1',
          categoryId: 'c1',
          active: true,
        }),
      );
      expect(await dialog.findByText('Details saved.')).toBeInTheDocument();
    });

    test('editing the Spanish description saves only that locale and field', async () => {
      api.updateUsedItemCopy.mockResolvedValue(undefined);
      const { user, dialog } = await openEdit();

      await user.click(dialog.getByRole('tab', { name: 'ES' }));
      const description = dialog.getByLabelText(/^Description/);
      await user.clear(description);
      await user.type(description, 'Unas 300 saltos');
      await user.click(dialog.getByRole('button', { name: 'Save copy' }));

      expect(api.updateUsedItemCopy).toHaveBeenCalledTimes(1);
      expect(api.updateUsedItemCopy).toHaveBeenCalledWith('token-1', 'u1', {
        field: 'descriptionMd',
        locale: 'es',
        value: 'Unas 300 saltos',
      });
    });

    test('removes a photo', async () => {
      api.deleteProductImage.mockResolvedValue(undefined);
      const { user, dialog } = await openEdit();

      await user.click(dialog.getByRole('button', { name: 'Remove photo 1' }));

      expect(api.deleteProductImage).toHaveBeenCalledWith('token-1', 'i1');
    });

    test('adds photos', async () => {
      api.uploadProductImages.mockResolvedValue([]);
      const { user, dialog } = await openEdit();
      const photo = new File(['bytes'], 'side.png', { type: 'image/png' });

      await user.upload(dialog.getByLabelText('Add photos'), photo);

      expect(api.uploadProductImages).toHaveBeenCalledWith('token-1', 'u1', [photo]);
    });

    test('shows the upload error, for example a file that is not an image', async () => {
      api.uploadProductImages.mockRejectedValue(new Error('side.png is not a JPEG, PNG or WebP image under 5 MB'));
      const { user, dialog } = await openEdit();

      await user.upload(dialog.getByLabelText('Add photos'), new File(['x'], 'side.png', { type: 'image/png' }));

      expect(await dialog.findByText('side.png is not a JPEG, PNG or WebP image under 5 MB')).toBeInTheDocument();
    });
  });
});
