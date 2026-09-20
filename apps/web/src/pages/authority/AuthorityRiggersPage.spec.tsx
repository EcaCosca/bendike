import { AUTHORITY_PAGE_SIZE, Role, type RiggerRegistryRow } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as api from './authority-api';
import { AuthorityRiggersPage } from './AuthorityRiggersPage';

jest.mock('../../auth/use-auth');
jest.mock('./authority-api');

const mocked = jest.mocked(api);

function rigger(overrides: Partial<RiggerRegistryRow> = {}): RiggerRegistryRow {
  return {
    id: 'r1',
    displayName: 'Eca Rigger',
    email: 'eca@bendike.example',
    phone: '+5493415550001',
    licence: 'AR-1234',
    signedSheets: 12,
    workRecorded: 30,
    lastActivityAt: '2026-09-18T15:00:00.000Z',
    customers: 4,
    ...overrides,
  };
}

function renderPage() {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'a1',
      email: 'anac@b.c',
      displayName: 'ANAC Inspector',
      role: Role.Authority,
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
      <AuthorityRiggersPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  mocked.getRiggers.mockResolvedValue({
    rows: [
      rigger(),
      rigger({
        id: 'r2',
        displayName: 'Lucía Plegadora',
        email: 'lucia@bendike.example',
        phone: null,
        licence: null,
        signedSheets: 0,
        workRecorded: 0,
        lastActivityAt: null,
        customers: 0,
      }),
    ],
    total: 2,
  });
});

describe('AuthorityRiggersPage', () => {
  it('lists every rigger with licence, counts, last activity and customers', async () => {
    renderPage();
    const row = (await screen.findByText('Eca Rigger')).closest('tr');
    expect(row).not.toBeNull();
    const cells = within(row as HTMLElement);
    expect(cells.getByText('eca@bendike.example')).toBeInTheDocument();
    expect(cells.getByText('+5493415550001')).toBeInTheDocument();
    expect(cells.getByText('AR-1234')).toBeInTheDocument();
    expect(cells.getByText('12')).toBeInTheDocument();
    expect(cells.getByText('30')).toBeInTheDocument();
    expect(cells.getByText('2026-09-18')).toBeInTheDocument();
    expect(cells.getByText('4')).toBeInTheDocument();
    expect(mocked.getRiggers).toHaveBeenCalledWith('token-1', { sort: 'name', page: 1 });
  });

  it('shows a dash where a rigger has no licence, phone or activity yet', async () => {
    renderPage();
    const row = (await screen.findByText('Lucía Plegadora')).closest('tr') as HTMLElement;
    expect(within(row).getAllByText('—')).toHaveLength(3);
  });

  it('opens a rigger log from the row', async () => {
    renderPage();
    const link = await screen.findByRole('link', { name: 'Eca Rigger' });
    expect(link).toHaveAttribute('href', '/app/authority/riggers/r1');
  });

  it('searches by name, email or licence and returns to page one', async () => {
    renderPage();
    await screen.findByText('Eca Rigger');
    await userEvent.type(screen.getByLabelText('Search'), 'AR-12');
    await waitFor(() =>
      expect(mocked.getRiggers).toHaveBeenLastCalledWith('token-1', { search: 'AR-12', sort: 'name', page: 1 }),
    );
  });

  it('sorts by last activity', async () => {
    renderPage();
    await screen.findByText('Eca Rigger');
    await userEvent.click(screen.getByLabelText('Sort by'));
    await userEvent.click(await screen.findByRole('option', { name: 'Last activity' }));
    await waitFor(() => expect(mocked.getRiggers).toHaveBeenLastCalledWith('token-1', { sort: 'activity', page: 1 }));
  });

  it('pages through the register', async () => {
    mocked.getRiggers.mockResolvedValue({ rows: [rigger()], total: AUTHORITY_PAGE_SIZE * 2 + 1 });
    renderPage();
    await screen.findByText('Eca Rigger');
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));
    await waitFor(() => expect(mocked.getRiggers).toHaveBeenLastCalledWith('token-1', { sort: 'name', page: 2 }));
  });

  it('says so when no rigger matches', async () => {
    mocked.getRiggers.mockResolvedValue({ rows: [], total: 0 });
    renderPage();
    expect(await screen.findByText('No riggers match.')).toBeInTheDocument();
  });

  it('shows the API error', async () => {
    mocked.getRiggers.mockRejectedValue(new Error('Forbidden'));
    renderPage();
    expect(await screen.findByText('Forbidden')).toBeInTheDocument();
  });
});
