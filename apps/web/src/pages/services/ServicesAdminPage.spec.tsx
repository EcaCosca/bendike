import { Role, type ServiceAdminDetail } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import { ServicesAdminPage } from './ServicesAdminPage';
import * as adminApi from './services-admin-api';

jest.mock('../../auth/use-auth');
jest.mock('./services-admin-api');

const api = jest.mocked(adminApi);

const text = (value: string) => ({ en: value, es: `${value} ES`, pt: `${value} PT` });

function service(overrides: Partial<ServiceAdminDetail> = {}): ServiceAdminDetail {
  return {
    id: 's1',
    slug: 'repack',
    category: 'repack',
    name: text('Reserve repack'),
    summary: text('Summary'),
    descriptionMd: text('Description'),
    turnaroundNote: null,
    translationOverrides: {},
    priceAmount: 55000,
    priceCurrency: 'ARS',
    position: 0,
    active: true,
    ...overrides,
  };
}

function renderPage() {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'u1',
      email: 'a@b.c',
      displayName: 'Eca',
      role: Role.Admin,
      authMethods: ['password'],
      phone: null,
      locale: 'es',
      createdAt: '2026-09-18T00:00:00.000Z',
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
      <ServicesAdminPage />
    </MemoryRouter>,
  );
}

describe('ServicesAdminPage', () => {
  beforeEach(() => {
    api.listAllServices.mockResolvedValue([
      service(),
      service({
        id: 's2',
        slug: 'reline',
        name: text('Reline'),
        priceAmount: null,
        priceCurrency: null,
        active: false,
      }),
    ]);
  });

  test('lists every service, active or not, with its price or that it varies', async () => {
    renderPage();

    expect(await screen.findByText('Reserve repack')).toBeInTheDocument();
    expect(screen.getByText('AR$ 55.000,00')).toBeInTheDocument();
    expect(screen.getByText('Reline')).toBeInTheDocument();
    expect(screen.getByText('Varies')).toBeInTheDocument();
  });

  test('toggling the active switch saves it and updates the row', async () => {
    const user = userEvent.setup();
    api.updateService.mockResolvedValue(service({ active: false }));
    renderPage();
    await screen.findByText('Reserve repack');

    await user.click(screen.getByRole('switch', { name: 'Active: Reserve repack' }));

    expect(api.updateService).toHaveBeenCalledWith('token-1', 's1', { active: false });
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Active: Reserve repack' })).not.toBeChecked());
  });

  test('shows the error when a change fails', async () => {
    const user = userEvent.setup();
    api.updateService.mockRejectedValue(new Error('Forbidden'));
    renderPage();
    await screen.findByText('Reserve repack');

    await user.click(screen.getByRole('switch', { name: 'Active: Reserve repack' }));

    expect(await screen.findByText('Forbidden')).toBeInTheDocument();
  });

  describe('adding a service', () => {
    async function openDialog() {
      const user = userEvent.setup();
      renderPage();
      await screen.findByText('Reserve repack');
      await user.click(screen.getByRole('button', { name: 'Add service' }));
      return { user, dialog: within(await screen.findByRole('dialog')) };
    }

    test('creates the service from English copy and a peso price and adds it to the list', async () => {
      api.createService.mockResolvedValue(
        service({ id: 's3', slug: 'patchwork', name: text('Patchwork'), priceAmount: 90000 }),
      );
      const { user, dialog } = await openDialog();

      await user.type(dialog.getByLabelText(/Slug/), 'patchwork');
      await user.type(dialog.getByLabelText(/^Name/), 'Patchwork');
      await user.type(dialog.getByLabelText(/^Summary/), 'Patch repairs');
      await user.type(dialog.getByLabelText(/^Description/), 'Patch repairs on your gear.');
      await user.type(dialog.getByLabelText(/Price amount/), '90.000');
      await user.click(dialog.getByRole('combobox', { name: /Currency/ }));
      await user.click(screen.getByRole('option', { name: 'ARS' }));
      await user.click(dialog.getByRole('button', { name: 'Create service' }));

      expect(api.createService).toHaveBeenCalledWith('token-1', {
        slug: 'patchwork',
        category: 'other',
        name: 'Patchwork',
        summary: 'Patch repairs',
        descriptionMd: 'Patch repairs on your gear.',
        priceAmount: 90000,
        priceCurrency: 'ARS',
      });
      expect(await screen.findByText('Patchwork')).toBeInTheDocument();
    });

    test('an amount without a currency is refused before calling the API', async () => {
      const { user, dialog } = await openDialog();

      await user.type(dialog.getByLabelText(/Slug/), 'x');
      await user.type(dialog.getByLabelText(/^Name/), 'X');
      await user.type(dialog.getByLabelText(/^Summary/), 'x');
      await user.type(dialog.getByLabelText(/^Description/), 'x');
      await user.type(dialog.getByLabelText(/Price amount/), '5000');
      await user.click(dialog.getByRole('button', { name: 'Create service' }));

      expect(await dialog.findByText('Enter both an amount and a currency, or leave both empty.')).toBeInTheDocument();
      expect(api.createService).not.toHaveBeenCalled();
    });

    test('shows the API error, such as a slug already in use', async () => {
      api.createService.mockRejectedValue(new Error('A service with slug x already exists'));
      const { user, dialog } = await openDialog();

      await user.type(dialog.getByLabelText(/Slug/), 'x');
      await user.type(dialog.getByLabelText(/^Name/), 'X');
      await user.type(dialog.getByLabelText(/^Summary/), 'x');
      await user.type(dialog.getByLabelText(/^Description/), 'x');
      await user.click(dialog.getByRole('button', { name: 'Create service' }));

      expect(await dialog.findByText('A service with slug x already exists')).toBeInTheDocument();
    });
  });

  describe('editing a service', () => {
    async function openEditor() {
      const user = userEvent.setup();
      renderPage();
      await screen.findByText('Reserve repack');
      await user.click(screen.getByRole('button', { name: 'Edit Reserve repack' }));
      return { user, dialog: within(await screen.findByRole('dialog')) };
    }

    test('changing the price saves the amount and currency', async () => {
      api.updateService.mockResolvedValue(service({ priceAmount: 60000 }));
      const { user, dialog } = await openEditor();

      const amount = dialog.getByLabelText(/Price amount/);
      await user.clear(amount);
      await user.type(amount, '60.000');
      await user.click(dialog.getByRole('button', { name: 'Save details' }));

      expect(api.updateService).toHaveBeenCalledWith('token-1', 's1', {
        priceAmount: 60000,
        priceCurrency: 'ARS',
        category: 'repack',
        position: 0,
      });
      expect(await dialog.findByText('Details saved.')).toBeInTheDocument();
    });

    test('clearing the amount and currency makes the price vary', async () => {
      api.updateService.mockResolvedValue(service({ priceAmount: null, priceCurrency: null }));
      const { user, dialog } = await openEditor();

      await user.clear(dialog.getByLabelText(/Price amount/));
      await user.click(dialog.getByRole('combobox', { name: /Currency/ }));
      await user.click(screen.getByRole('option', { name: 'No price (varies)' }));
      await user.click(dialog.getByRole('button', { name: 'Save details' }));

      expect(api.updateService).toHaveBeenCalledWith(
        'token-1',
        's1',
        expect.objectContaining({ priceAmount: null, priceCurrency: null }),
      );
    });

    test('editing the Spanish description saves only that locale and field', async () => {
      api.updateServiceCopy.mockResolvedValue(service());
      const { user, dialog } = await openEditor();

      await user.click(dialog.getByRole('tab', { name: 'ES' }));
      const description = dialog.getByLabelText(/^Description/);
      await user.clear(description);
      await user.type(description, 'Nueva descripción');
      await user.click(dialog.getByRole('button', { name: 'Save copy' }));

      expect(api.updateServiceCopy).toHaveBeenCalledTimes(1);
      expect(api.updateServiceCopy).toHaveBeenCalledWith('token-1', 's1', {
        field: 'descriptionMd',
        locale: 'es',
        value: 'Nueva descripción',
      });
    });

    test('saving copy with no changes makes no request', async () => {
      const { user, dialog } = await openEditor();

      await user.click(dialog.getByRole('button', { name: 'Save copy' }));

      expect(api.updateServiceCopy).not.toHaveBeenCalled();
    });
  });
});
