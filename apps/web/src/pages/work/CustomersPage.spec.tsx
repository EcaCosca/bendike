import { Role, type CustomerSummary } from '@bendike/shared';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as api from './work-api';
import { CustomersPage } from './CustomersPage';

jest.mock('../../auth/use-auth');
jest.mock('./work-api');

const mocked = jest.mocked(api);

const customers: CustomerSummary[] = [
  {
    owner: {
      id: 'o1',
      displayName: 'Salta en Rosario',
      role: Role.Dropzone,
      phone: '+5493415550002',
      email: 'dz@bendike.example',
      locale: 'es',
    },
    rigs: 11,
    overdue: 2,
    dueSoon: 1,
    grounded: 1,
  },
  {
    owner: { id: 'o2', displayName: 'Ana', role: Role.User, phone: null, email: 'ana@bendike.example', locale: 'en' },
    rigs: 1,
    overdue: 0,
    dueSoon: 0,
    grounded: 0,
  },
];

function renderPage() {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'r1',
      email: 'eca@b.c',
      displayName: 'Eca',
      role: Role.Rigger,
      authMethods: ['password'],
      phone: null,
      locale: 'es',
      country: null,
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
      <CustomersPage />
    </MemoryRouter>,
  );
}

describe('CustomersPage', () => {
  beforeEach(() => {
    mocked.getCustomers.mockResolvedValue(customers);
  });

  test('lists each customer with their rigs and how many need attention', async () => {
    renderPage();

    const table = await screen.findByRole('table', { name: 'Customers and dropzones' });
    const salta = within(table).getByText('Salta en Rosario').closest('tr') as HTMLElement;
    expect(within(salta).getByText('11')).toBeInTheDocument();
    expect(within(salta).getByText('2')).toBeInTheDocument();
    expect(within(salta).getByRole('link', { name: 'View fleet' })).toHaveAttribute('href', '/app/gear?ownerId=o1');
  });

  test('gives a WhatsApp link when there is a phone and an email link otherwise', async () => {
    renderPage();
    const table = await screen.findByRole('table', { name: 'Customers and dropzones' });

    expect(
      within(within(table).getByText('Salta en Rosario').closest('tr') as HTMLElement).getByRole('link', {
        name: 'WhatsApp',
      }),
    ).toHaveAttribute('href', 'https://wa.me/5493415550002');
    expect(
      within(within(table).getByText('Ana').closest('tr') as HTMLElement).getByRole('link', { name: 'Email' }),
    ).toHaveAttribute('href', 'mailto:ana@bendike.example');
  });

  test('says so when there are no customers yet and points to adding one', async () => {
    mocked.getCustomers.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/no customers or dropzones yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add a customer' })).toHaveAttribute('href', '/app/riggers');
  });
});
