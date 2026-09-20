import { AUTHORITY_PAGE_SIZE, Role, type AuthorityRigRow, type CountryCode } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as api from './authority-api';
import { AuthorityRigsPage } from './AuthorityRigsPage';

jest.mock('../../auth/use-auth');
jest.mock('./authority-api');

const mocked = jest.mocked(api);

function rig(overrides: Partial<AuthorityRigRow> = {}): AuthorityRigRow {
  return {
    rigId: 'rig-1',
    rigName: 'Tandem 1',
    ownerName: 'Aeroclub Demo',
    ownerCountry: 'AR',
    reserve: 'UPT Vector Sigma Reserve',
    reserveSerial: 'R-2001',
    lastPackedOn: '2026-09-15',
    riggerId: 'r1',
    riggerName: 'Lucas Herrera',
    riggerLicence: 'AR-2041',
    sheets: 3,
    latestSheetId: 'sheet-9',
    ...overrides,
  };
}

function renderPage(country: CountryCode | null = 'AR') {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'a1',
      email: 'anac@b.c',
      displayName: 'ANAC Inspector',
      role: Role.Authority,
      authMethods: ['password'],
      phone: null,
      locale: 'en',
      country,
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
      <AuthorityRigsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  mocked.getRigs.mockResolvedValue({
    rows: [
      rig(),
      rig({
        rigId: 'rig-2',
        rigName: 'Fun 1',
        ownerName: 'Diego Visitor',
        ownerCountry: 'US',
        reserve: 'PD Optimum 143',
        reserveSerial: null,
        riggerName: 'Sofía Ledesma',
        riggerLicence: null,
        sheets: 1,
        latestSheetId: 'sheet-2',
      }),
      rig({ rigId: 'rig-3', rigName: 'Fun 2', ownerName: 'Elena Nueva', ownerCountry: null }),
    ],
    total: 3,
  });
});

describe('AuthorityRigsPage', () => {
  it('lists every packed rig with owner, country, reserve, last packing, rigger and sheets', async () => {
    renderPage();
    const row = (await screen.findByRole('link', { name: 'Tandem 1' })).closest('tr') as HTMLElement;
    const cells = within(row);
    expect(cells.getByText('Aeroclub Demo')).toBeInTheDocument();
    expect(cells.getByText('Argentina')).toBeInTheDocument();
    expect(cells.getByText('UPT Vector Sigma Reserve')).toBeInTheDocument();
    expect(cells.getByText('R-2001')).toBeInTheDocument();
    expect(cells.getByText('2026-09-15')).toBeInTheDocument();
    expect(cells.getByText('Lucas Herrera')).toBeInTheDocument();
    expect(cells.getByText('AR-2041')).toBeInTheDocument();
    expect(cells.getByText('3')).toBeInTheDocument();
    expect(mocked.getRigs).toHaveBeenCalledWith('token-1', { page: 1 });
  });

  it('opens the latest signed sheet from the rig', async () => {
    renderPage();
    expect(await screen.findByRole('link', { name: 'Tandem 1' })).toHaveAttribute(
      'href',
      '/app/gear/rig-1/packing/sheet-9/print',
    );
  });

  it('shows the country by name, and a dash where the owner has not stated one or the rigger has no licence', async () => {
    renderPage();
    const foreign = (await screen.findByRole('link', { name: 'Fun 1' })).closest('tr') as HTMLElement;
    expect(within(foreign).getByText('United States')).toBeInTheDocument();
    expect(within(foreign).getAllByText('—')).toHaveLength(2);
    const unknown = screen.getByRole('link', { name: 'Fun 2' }).closest('tr') as HTMLElement;
    expect(within(unknown).getByText('Not stated')).toBeInTheDocument();
  });

  it('filters to the owners who live in the authority country and returns to page one', async () => {
    renderPage();
    await screen.findByText('Tandem 1');
    await userEvent.click(screen.getByLabelText('Where the owner lives'));
    await userEvent.click(await screen.findByRole('option', { name: 'Local (Argentina)' }));
    await waitFor(() => expect(mocked.getRigs).toHaveBeenLastCalledWith('token-1', { residence: 'local', page: 1 }));
  });

  it('offers abroad and not stated too', async () => {
    renderPage();
    await screen.findByText('Tandem 1');
    await userEvent.click(screen.getByLabelText('Where the owner lives'));
    await userEvent.click(await screen.findByRole('option', { name: 'Abroad' }));
    await waitFor(() => expect(mocked.getRigs).toHaveBeenLastCalledWith('token-1', { residence: 'abroad', page: 1 }));
    await userEvent.click(screen.getByLabelText('Where the owner lives'));
    await userEvent.click(await screen.findByRole('option', { name: 'Not stated' }));
    await waitFor(() => expect(mocked.getRigs).toHaveBeenLastCalledWith('token-1', { residence: 'unknown', page: 1 }));
  });

  it('asks the authority to set its country, and cannot filter by local or abroad until then', async () => {
    renderPage(null);
    await screen.findByText('Tandem 1');
    expect(screen.getByRole('link', { name: 'Set your country in your details' })).toHaveAttribute(
      'href',
      '/app/profile',
    );
    await userEvent.click(screen.getByLabelText('Where the owner lives'));
    expect(await screen.findByRole('option', { name: 'Local' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('option', { name: 'Abroad' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('option', { name: 'Not stated' })).not.toHaveAttribute('aria-disabled');
  });

  it('searches by rig, owner, serial or rigger', async () => {
    renderPage();
    await screen.findByText('Tandem 1');
    await userEvent.type(screen.getByLabelText('Search'), 'R-2001');
    await waitFor(() => expect(mocked.getRigs).toHaveBeenLastCalledWith('token-1', { search: 'R-2001', page: 1 }));
  });

  it('pages through the register', async () => {
    mocked.getRigs.mockResolvedValue({ rows: [rig()], total: AUTHORITY_PAGE_SIZE + 1 });
    renderPage();
    await screen.findByText('Tandem 1');
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));
    await waitFor(() => expect(mocked.getRigs).toHaveBeenLastCalledWith('token-1', { page: 2 }));
  });

  it('says so when no rig matches', async () => {
    mocked.getRigs.mockResolvedValue({ rows: [], total: 0 });
    renderPage();
    expect(await screen.findByText('No packed rigs match.')).toBeInTheDocument();
  });

  it('shows the API error', async () => {
    mocked.getRigs.mockRejectedValue(new Error('Forbidden'));
    renderPage();
    expect(await screen.findByText('Forbidden')).toBeInTheDocument();
  });
});
