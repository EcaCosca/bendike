import { Role, type GearOverview } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import { gearItem, pending, rigView } from './fixtures';
import * as api from './gear-api';
import { GEAR_VIEW_KEY } from './gear-view';
import { GearPage } from './GearPage';

jest.mock('../../auth/use-auth');
jest.mock('./gear-api');

const mocked = jest.mocked(api);

function overview(overrides: Partial<GearOverview> = {}): GearOverview {
  const overdueReserve = gearItem('reserve', {
    id: 'r1',
    rigId: 'escuela-11',
    manufacturer: 'Aerodyne',
    model: 'Smart 175',
    serial: '12934',
    status: 'overdue',
    dues: [{ kind: 'repack', dueOn: '2026-08-28', daysLeft: -22, status: 'overdue' }],
  });
  return {
    rigs: [
      rigView('Micro 3', {
        status: 'ok',
        slots: {
          container: null,
          main: null,
          reserve: gearItem('reserve', {
            id: 'r2',
            manufacturer: 'UPT',
            model: 'VTC-2R',
            serial: '007284',
            dues: [{ kind: 'repack', dueOn: '2026-12-08', daysLeft: 80, status: 'ok' }],
          }),
          aad: null,
        },
      }),
      rigView('Escuela 11', {
        status: 'overdue',
        slots: { container: null, main: null, reserve: overdueReserve, aad: null },
      }),
      rigView('Fleet 9', {
        status: 'due_soon',
        readiness: {
          state: 'grounded',
          reasons: [{ type: 'pending_verification', entries: [pending()] }],
        },
      }),
      rigView('Old rig', { active: false }),
    ],
    spares: [gearItem('aad', { id: 's1', manufacturer: 'AAD', model: 'Vigil 2', serial: '45545', status: 'due_soon' })],
    summary: { overdue: 1, due_soon: 1, no_data: 0, ok: 1, grounded: 1 },
    ...overrides,
  };
}

function renderPage(role: Role = Role.Dropzone) {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'owner-1',
      email: 'dz@b.c',
      displayName: 'Salta en Rosario',
      role,
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
  return render(
    <MemoryRouter>
      <GearPage />
    </MemoryRouter>,
  );
}

describe('GearPage', () => {
  beforeEach(() => {
    localStorage.setItem(GEAR_VIEW_KEY, 'cards');
    mocked.getOverview.mockResolvedValue(overview());
    mocked.listModels.mockResolvedValue([]);
  });

  afterEach(() => localStorage.clear());

  test('a dropzone sees its fleet, a user sees my gear', async () => {
    renderPage(Role.Dropzone);
    expect(await screen.findByRole('heading', { name: 'Fleet' })).toBeInTheDocument();
  });

  test('a user sees the page titled my gear', async () => {
    renderPage(Role.User);
    expect(await screen.findByRole('heading', { name: 'My gear' })).toBeInTheDocument();
  });

  test('lists rigs with a coloured badge that also says the status in words', async () => {
    renderPage();

    const overdueRig = (await screen.findByRole('link', { name: 'Escuela 11' })).closest(
      '[data-testid="rig-card"]',
    ) as HTMLElement;
    expect(within(overdueRig).getByText('Overdue')).toBeInTheDocument();
    expect(within(overdueRig).getByText(/Repack .*22 days overdue/)).toBeInTheDocument();
    const okRig = screen.getByRole('link', { name: 'Micro 3' }).closest('[data-testid="rig-card"]') as HTMLElement;
    expect(within(okRig).getByText('OK')).toBeInTheDocument();
  });

  test('each rig card says when it was last inspected, or that it never was', async () => {
    const data = overview();
    data.rigs[0] = {
      ...data.rigs[0]!,
      lastInspection: {
        entryId: 'i',
        gearItemId: 'g',
        performedOn: '2026-09-15',
        result: 'passed',
        performedByName: 'Eca',
        description: '',
      },
    };
    mocked.getOverview.mockResolvedValue(data);
    renderPage();

    const inspected = (await screen.findByRole('link', { name: 'Micro 3' })).closest(
      '[data-testid="rig-card"]',
    ) as HTMLElement;
    expect(within(inspected).getByText(/Inspected 2026-09-15: Passed by Eca/)).toBeInTheDocument();
    const never = screen.getByRole('link', { name: 'Escuela 11' }).closest('[data-testid="rig-card"]') as HTMLElement;
    expect(within(never).getByText('Never inspected')).toBeInTheDocument();
  });

  test('viewing a customer fleet hides the buttons that add gear to it', async () => {
    jest.mocked(useAuthModule.useAuth).mockReturnValue({
      user: {
        id: 'r1',
        email: 'r@b.c',
        displayName: 'Eca',
        role: Role.Rigger,
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
      <MemoryRouter initialEntries={['/app/gear?ownerId=dz-1']}>
        <GearPage />
      </MemoryRouter>,
    );

    await screen.findByRole('link', { name: 'Micro 3' });
    expect(mocked.getOverview).toHaveBeenCalledWith('token-1', 'dz-1');
    expect(screen.queryByRole('button', { name: 'Add rig' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add component' })).not.toBeInTheDocument();
  });

  test('a rig grounded by a rigger says so on its card', async () => {
    const data = overview();
    data.rigs[1] = {
      ...data.rigs[1]!,
      readiness: {
        state: 'grounded',
        reasons: [
          {
            type: 'grounding',
            grounding: {
              id: 'g1',
              rigId: 'escuela-11',
              gearItemId: null,
              reason: 'Frayed handle',
              source: 'manual',
              bulletinMatchId: null,
              openedByName: 'Eca',
              openedAt: '2026-09-18T10:00:00.000Z',
              closedByName: null,
              closedAt: null,
              closeNote: null,
            },
          },
        ],
      },
    };
    mocked.getOverview.mockResolvedValue(data);
    renderPage();

    const card = (await screen.findByRole('link', { name: 'Escuela 11' })).closest(
      '[data-testid="rig-card"]',
    ) as HTMLElement;
    expect(within(card).getByText('GROUNDED')).toBeInTheDocument();
    expect(within(card).getByText('Grounded by a rigger: Frayed handle')).toBeInTheDocument();
  });

  test('marks a rig awaiting verification as grounded, distinct from the status colours', async () => {
    renderPage();

    const grounded = (await screen.findByRole('link', { name: 'Fleet 9' })).closest(
      '[data-testid="rig-card"]',
    ) as HTMLElement;
    expect(within(grounded).getByText('GROUNDED')).toBeInTheDocument();
    expect(within(grounded).getByText(/awaiting verification/i)).toBeInTheDocument();
  });

  test('shows the summary counts, the spare gear and the inactive rigs separately', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: /Overdue 1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Grounded 1/ })).toBeInTheDocument();
    const spare = screen.getByRole('region', { name: 'Spare gear' });
    expect(within(spare).getByText(/Vigil 2/)).toBeInTheDocument();
    const inactive = screen.getByRole('region', { name: 'Inactive' });
    expect(within(inactive).getByRole('link', { name: 'Old rig' })).toBeInTheDocument();
  });

  test('clicking a summary count filters the list to that status', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('link', { name: 'Escuela 11' });

    await user.click(screen.getByRole('button', { name: /Overdue 1/ }));

    expect(screen.getByRole('link', { name: 'Escuela 11' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Micro 3' })).not.toBeInTheDocument();
  });

  test('searching by serial finds the rig', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('link', { name: 'Micro 3' });

    await user.type(screen.getByRole('textbox', { name: 'Search' }), '007284');

    expect(screen.getByRole('link', { name: 'Micro 3' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Escuela 11' })).not.toBeInTheDocument();
  });

  test('most urgent first is the default order', async () => {
    renderPage();
    await screen.findByRole('link', { name: 'Escuela 11' });

    const rigsSection = screen.getByRole('region', { name: 'Rigs' });
    const names = within(rigsSection)
      .getAllByTestId('rig-card')
      .map((card) => within(card).getAllByRole('link')[0]?.textContent);

    expect(names).toEqual(['Fleet 9', 'Escuela 11', 'Micro 3']);
  });

  test('with no gear yet it invites the owner to add a rig', async () => {
    mocked.getOverview.mockResolvedValue({
      rigs: [],
      spares: [],
      summary: { overdue: 0, due_soon: 0, no_data: 0, ok: 0, grounded: 0 },
    });
    renderPage();

    expect(await screen.findByText(/no rigs yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add rig' })).toBeInTheDocument();
  });

  test('adds a rig and reloads the list', async () => {
    const user = userEvent.setup();
    mocked.createRig.mockResolvedValue(rigView('Micro 5'));
    renderPage();
    await screen.findByRole('link', { name: 'Micro 3' });

    await user.click(screen.getByRole('button', { name: 'Add rig' }));
    await user.type(within(screen.getByRole('dialog')).getByLabelText(/Name/), 'Micro 5');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocked.createRig).toHaveBeenCalledWith('token-1', { name: 'Micro 5' }));
    await waitFor(() => expect(mocked.getOverview).toHaveBeenCalledTimes(2));
  });

  test('shows the error when the gear cannot be loaded', async () => {
    mocked.getOverview.mockRejectedValue(new Error('Boom'));
    renderPage();

    expect(await screen.findByText('Boom')).toBeInTheDocument();
  });
});

describe('GearPage grid view', () => {
  beforeEach(() => {
    localStorage.removeItem(GEAR_VIEW_KEY);
    mocked.getOverview.mockResolvedValue(overview());
    mocked.listModels.mockResolvedValue([]);
  });

  afterEach(() => localStorage.clear());

  test('shows the equipment grid by default, with manufacturer and serial, instead of cards', async () => {
    renderPage();

    const table = await screen.findByRole('table', { name: 'Equipment' });
    expect(within(table).getByText('Aerodyne')).toBeInTheDocument();
    expect(within(table).getByText('12934')).toBeInTheDocument();
    expect(screen.queryByTestId('rig-card')).not.toBeInTheDocument();
  });

  test('the summary chips and search filter the grid', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('table', { name: 'Equipment' });

    await user.click(screen.getByRole('button', { name: /Overdue 1/ }));

    const table = screen.getByRole('table', { name: 'Equipment' });
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(within(table).getByText('Smart 175')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Overdue 1/ }));
    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'vtc');

    expect(within(screen.getByRole('table', { name: 'Equipment' })).getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('VTC-2R')).toBeInTheDocument();
  });

  test('switching to cards shows the rig cards and the choice is remembered', async () => {
    const user = userEvent.setup();
    const { unmount } = renderPage();
    await screen.findByRole('table', { name: 'Equipment' });

    await user.click(screen.getByRole('button', { name: 'Cards' }));

    expect(await screen.findByRole('link', { name: 'Escuela 11' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    unmount();

    renderPage();
    expect(await screen.findByRole('link', { name: 'Escuela 11' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Grid' }));
    expect(await screen.findByRole('table', { name: 'Equipment' })).toBeInTheDocument();
  });

  test('with no gear yet the grid view still invites the owner to add a rig', async () => {
    mocked.getOverview.mockResolvedValue({
      rigs: [],
      spares: [],
      summary: { overdue: 0, due_soon: 0, no_data: 0, ok: 0, grounded: 0 },
    });
    renderPage();

    expect(await screen.findByText(/no rigs yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
