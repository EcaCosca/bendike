import { Role, type WorkItem, type WorkItemOwner, type WorkQueueResponse } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as bulletinApi from '../bulletins/bulletins-api';
import * as gearApi from '../gear/gear-api';
import * as api from './work-api';
import { WorkQueuePage } from './WorkQueuePage';

jest.mock('../../auth/use-auth');
jest.mock('../gear/gear-api');
jest.mock('../bulletins/bulletins-api');
jest.mock('./work-api');

const mocked = jest.mocked(api);
const gear = jest.mocked(gearApi);

const salta: WorkItemOwner = {
  id: 'o1',
  displayName: 'Salta en Rosario',
  role: Role.Dropzone,
  phone: '+5493415550002',
  email: 'dz@bendike.example',
  locale: 'es',
};
const ana: WorkItemOwner = {
  id: 'o2',
  displayName: 'Ana',
  role: Role.User,
  phone: null,
  email: 'ana@bendike.example',
  locale: 'en',
};

function item(id: string, overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id,
    owner: salta,
    rig: { id: 'micro-3', name: 'Micro 3', grounded: false },
    item: { id: 'reserve-1', kind: 'reserve', manufacturer: 'PD', model: 'VR360', serial: '10586' },
    dueKind: 'repack',
    dueOn: '2026-08-28',
    daysLeft: -22,
    status: 'overdue',
    ...overrides,
  };
}

function response(overrides: Partial<WorkQueueResponse> = {}): WorkQueueResponse {
  return {
    items: [
      item('a'),
      item('b', {
        owner: ana,
        rig: { id: 'ana-rig', name: 'Ana rig', grounded: false },
        item: { id: 'aad-1', kind: 'aad', manufacturer: 'Vigil', model: 'Vigil 4', serial: '20601' },
        dueKind: 'expiry',
        dueOn: '2026-11-20',
        daysLeft: 62,
        status: 'due_soon',
      }),
    ],
    total: 2,
    page: 1,
    pageSize: 25,
    counts: { overdue: 1, due_soon: 1, no_data: 0, awaitingVerification: 1, grounded: 1 },
    owners: [
      { id: 'o2', displayName: 'Ana' },
      { id: 'o1', displayName: 'Salta en Rosario' },
    ],
    verifications: [
      {
        entryId: 'e1',
        owner: ana,
        rig: { id: 'ana-rig', name: 'Ana rig' },
        item: { id: 'reserve-2', kind: 'reserve', manufacturer: 'PD', model: 'Reserve' },
        kind: 'repack',
        performedOn: '2026-09-12',
        performedByName: 'Carlos Packer',
        performedByContact: '+54 9 341 555 0000',
      },
    ],
    groundedRigs: [],
    ...overrides,
  };
}

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
      <WorkQueuePage />
    </MemoryRouter>,
  );
}

describe('WorkQueuePage', () => {
  beforeEach(() => {
    mocked.getQueue.mockResolvedValue(response());
    mocked.getRiggerSettings.mockResolvedValue({ digestEnabled: true });
  });

  test('asks for everything due in the next 60 days, most urgent first', async () => {
    renderPage();
    await screen.findByRole('table', { name: 'Work queue' });

    expect(mocked.getQueue).toHaveBeenCalledWith('token-1', {
      status: 'all',
      withinDays: 60,
      sort: 'urgency',
      page: 1,
      pageSize: 25,
    });
  });

  test('shows the counts at the top', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: /Overdue 1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Due soon 1/ })).toBeInTheDocument();
    expect(screen.getByText(/Awaiting verification 1/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Grounded 1/ })).toBeInTheDocument();
  });

  test('each row names the owner, rig, component, what is due, how long and the status in words', async () => {
    renderPage();

    const table = await screen.findByRole('table', { name: 'Work queue' });
    const overdue = within(table).getByText('Micro 3').closest('tr') as HTMLElement;
    expect(within(overdue).getByText('Salta en Rosario')).toBeInTheDocument();
    expect(within(overdue).getByText(/PD VR360/)).toBeInTheDocument();
    expect(within(overdue).getByText(/Repack/)).toBeInTheDocument();
    expect(within(overdue).getByText(/22 days overdue/)).toBeInTheDocument();
    expect(within(overdue).getByText('Overdue')).toBeInTheDocument();
    const soon = within(table).getByText('Ana rig').closest('tr') as HTMLElement;
    expect(within(soon).getByText('Due soon')).toBeInTheDocument();
  });

  test('Contact opens WhatsApp with a message in the owner language; without a phone it falls back to email', async () => {
    renderPage();
    const table = await screen.findByRole('table', { name: 'Work queue' });

    const whatsapp = within(within(table).getByText('Micro 3').closest('tr') as HTMLElement).getByRole('link', {
      name: 'Contact',
    });
    expect(whatsapp.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/5493415550002\?text=/);
    expect(decodeURIComponent(whatsapp.getAttribute('href') ?? '')).toMatch(
      /Hola Salta en Rosario, soy Eca de Bendike/,
    );
    const email = within(within(table).getByText('Ana rig').closest('tr') as HTMLElement).getByRole('link', {
      name: 'Contact',
    });
    expect(email.getAttribute('href')).toMatch(/^mailto:ana%40bendike\.example\?subject=/);
  });

  test('Log repack records it with today as the date and refreshes the row', async () => {
    const user = userEvent.setup();
    gear.addEntry.mockResolvedValue({} as never);
    renderPage();
    const table = await screen.findByRole('table', { name: 'Work queue' });

    await user.click(
      within(within(table).getByText('Micro 3').closest('tr') as HTMLElement).getByRole('button', {
        name: 'Log repack',
      }),
    );
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Note'), 'New pilot chute');
    await user.click(dialog.getByRole('button', { name: 'Log repack' }));

    await waitFor(() =>
      expect(gear.addEntry).toHaveBeenCalledWith('token-1', 'reserve-1', {
        kind: 'repack',
        performedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        description: 'New pilot chute',
      }),
    );
    await waitFor(() => expect(mocked.getQueue).toHaveBeenCalledTimes(2));
  });

  test('a repack with no note is described as a plain repack', async () => {
    const user = userEvent.setup();
    gear.addEntry.mockResolvedValue({} as never);
    renderPage();
    const table = await screen.findByRole('table', { name: 'Work queue' });

    await user.click(
      within(within(table).getByText('Micro 3').closest('tr') as HTMLElement).getByRole('button', {
        name: 'Log repack',
      }),
    );
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Log repack' }));

    await waitFor(() =>
      expect(gear.addEntry).toHaveBeenCalledWith(
        'token-1',
        'reserve-1',
        expect.objectContaining({ description: 'Repack' }),
      ),
    );
  });

  test('a row can ground its rig straight from the queue, and a spare has no rig to ground', async () => {
    const user = userEvent.setup();
    jest.mocked(bulletinApi.openGrounding).mockResolvedValue({} as never);
    mocked.getQueue.mockResolvedValue(
      response({
        items: [
          item('a'),
          item('spare', {
            rig: null,
            item: { id: 'spare-1', kind: 'aad', manufacturer: 'Vigil', model: 'Vigil 2', serial: '45545' },
          }),
        ],
      }),
    );
    renderPage();
    const table = await screen.findByRole('table', { name: 'Work queue' });
    const rigRow = within(table).getByText('Micro 3').closest('tr') as HTMLElement;

    await user.click(within(rigRow).getByRole('button', { name: 'Ground rig' }));
    await user.type(within(screen.getByRole('dialog')).getByLabelText('Reason'), 'Pin looks bent');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Ground' }));

    await waitFor(() =>
      expect(bulletinApi.openGrounding).toHaveBeenCalledWith('token-1', { rigId: 'micro-3', reason: 'Pin looks bent' }),
    );
    const spareRow = within(table).getByText('Spare gear').closest('tr') as HTMLElement;
    expect(within(spareRow).queryByRole('button', { name: 'Ground rig' })).not.toBeInTheDocument();
  });

  test('a rig that is already grounded offers no second Ground button', async () => {
    mocked.getQueue.mockResolvedValue(
      response({ items: [item('a', { rig: { id: 'micro-3', name: 'Micro 3', grounded: true } })] }),
    );
    renderPage();
    const table = await screen.findByRole('table', { name: 'Work queue' });

    expect(within(table).queryByRole('button', { name: 'Ground rig' })).not.toBeInTheDocument();
  });

  test('other due dates offer Log work instead', async () => {
    renderPage();
    const table = await screen.findByRole('table', { name: 'Work queue' });

    const row = within(table).getByText('Ana rig').closest('tr') as HTMLElement;
    expect(within(row).getByRole('button', { name: 'Log work' })).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: 'Log repack' })).not.toBeInTheDocument();
  });

  test('lists work awaiting verification with who packed it and lets the rigger verify', async () => {
    const user = userEvent.setup();
    gear.verifyEntry.mockResolvedValue({} as never);
    renderPage();

    const section = await screen.findByRole('region', { name: 'Awaiting your verification' });
    expect(within(section).getByText(/Carlos Packer/)).toBeInTheDocument();
    expect(within(section).getByText(/\+54 9 341 555 0000/)).toBeInTheDocument();
    await user.click(within(section).getByRole('button', { name: 'Verify' }));

    await waitFor(() => expect(gear.verifyEntry).toHaveBeenCalledWith('token-1', 'e1'));
    await waitFor(() => expect(mocked.getQueue).toHaveBeenCalledTimes(2));
  });

  test('lists the grounded rigs waiting for the rigger, with each reason and a link to the rig', async () => {
    mocked.getQueue.mockResolvedValue(
      response({
        groundedRigs: [
          {
            rig: { id: 'fleet-9', name: 'Fleet 9' },
            owner: salta,
            reasons: ['Grounded by Eca: Frayed handle', 'Work awaiting verification (1)'],
          },
        ],
      }),
    );
    renderPage();

    const section = await screen.findByRole('region', { name: 'Grounded rigs' });
    expect(within(section).getByRole('link', { name: 'Fleet 9' })).toHaveAttribute('href', '/app/gear/fleet-9');
    expect(within(section).getByText('Salta en Rosario')).toBeInTheDocument();
    expect(within(section).getByText('Grounded by Eca: Frayed handle')).toBeInTheDocument();
    expect(within(section).getByText('Work awaiting verification (1)')).toBeInTheDocument();
  });

  test('links to the service bulletins to review', async () => {
    renderPage();

    expect(await screen.findByRole('link', { name: 'Service bulletins' })).toHaveAttribute(
      'href',
      '/app/work/bulletins',
    );
  });

  test('filtering by owner asks the API again', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('table', { name: 'Work queue' });

    await user.click(screen.getByRole('combobox', { name: 'Customer or dropzone' }));
    await user.click(screen.getByRole('option', { name: 'Ana' }));

    await waitFor(() =>
      expect(mocked.getQueue).toHaveBeenLastCalledWith('token-1', expect.objectContaining({ ownerId: 'o2', page: 1 })),
    );
  });

  test('clicking a count filters by that status', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('table', { name: 'Work queue' });

    await user.click(screen.getByRole('button', { name: /Overdue 1/ }));

    await waitFor(() =>
      expect(mocked.getQueue).toHaveBeenLastCalledWith('token-1', expect.objectContaining({ status: 'overdue' })),
    );
  });

  test('searching by serial or rig waits for a pause in typing', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('table', { name: 'Work queue' });

    await user.type(screen.getByRole('textbox', { name: 'Search' }), '10586');

    await waitFor(() =>
      expect(mocked.getQueue).toHaveBeenLastCalledWith('token-1', expect.objectContaining({ search: '10586' })),
    );
  });

  test('pages through a long queue', async () => {
    const user = userEvent.setup();
    mocked.getQueue.mockResolvedValue(response({ total: 60 }));
    renderPage();
    await screen.findByRole('table', { name: 'Work queue' });

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));

    await waitFor(() =>
      expect(mocked.getQueue).toHaveBeenLastCalledWith('token-1', expect.objectContaining({ page: 2 })),
    );
  });

  test('an empty window says so', async () => {
    mocked.getQueue.mockResolvedValue(
      response({
        items: [],
        total: 0,
        verifications: [],
        counts: { overdue: 0, due_soon: 0, no_data: 0, awaitingVerification: 0, grounded: 0 },
      }),
    );
    renderPage();

    expect(await screen.findByText(/Nothing in this window/)).toBeInTheDocument();
  });

  test('shows the error when the queue cannot be loaded', async () => {
    mocked.getQueue.mockRejectedValue(new Error('Boom'));
    renderPage();

    expect(await screen.findByText('Boom')).toBeInTheDocument();
  });
});
