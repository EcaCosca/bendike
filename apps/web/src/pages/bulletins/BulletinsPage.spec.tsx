import { Role, type BulletinView } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as api from './bulletins-api';
import { BulletinsPage } from './BulletinsPage';

jest.mock('../../auth/use-auth');
jest.mock('./bulletins-api');

const mocked = jest.mocked(api);

function bulletin(overrides: Partial<BulletinView> = {}): BulletinView {
  return {
    id: 'b1',
    manufacturer: 'PD',
    reference: 'SB-2026-01',
    title: 'Slider grommet check',
    summary: 'Some sliders have a loose grommet',
    requiredAction: 'Inspect and replace the grommet',
    sourceUrl: null,
    issuedOn: '2026-09-01',
    severity: 'mandatory',
    status: 'draft',
    publishedAt: null,
    targets: [{ id: 't1', model: 'VR360', serialFrom: '10000', serialTo: '11000' }],
    matchCounts: { open: 0, total: 0 },
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
      <BulletinsPage />
    </MemoryRouter>,
  );
}

describe('BulletinsPage', () => {
  beforeEach(() => {
    mocked.listBulletins.mockResolvedValue([
      bulletin(),
      bulletin({
        id: 'b2',
        reference: 'SB-LIVE',
        title: 'Stop using',
        severity: 'grounding',
        status: 'published',
        matchCounts: { open: 2, total: 3 },
      }),
    ]);
  });

  test('lists every bulletin with its severity, status and how many components matched', async () => {
    renderPage();

    const draft = (await screen.findByText('SB-2026-01')).closest('tr') as HTMLElement;
    expect(within(draft).getByText('Draft')).toBeInTheDocument();
    expect(within(draft).getByText('Mandatory')).toBeInTheDocument();
    const live = screen.getByText('SB-LIVE').closest('tr') as HTMLElement;
    expect(within(live).getByText('Published')).toBeInTheDocument();
    expect(within(live).getByText('Grounding')).toBeInTheDocument();
    expect(within(live).getByText('2 open of 3')).toBeInTheDocument();
  });

  test('creates a bulletin with its targets, leaving blank target fields out', async () => {
    const user = userEvent.setup();
    mocked.createBulletin.mockResolvedValue(bulletin());
    renderPage();
    await screen.findByText('SB-2026-01');

    await user.click(screen.getByRole('button', { name: 'New bulletin' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Manufacturer'), 'PD');
    await user.type(dialog.getByLabelText('Reference'), 'SB-9');
    await user.type(dialog.getByLabelText('Title'), 'Handle check');
    await user.type(dialog.getByLabelText('Summary'), 'Handles may crack');
    await user.type(dialog.getByLabelText('Required action'), 'Replace cracked handles');
    await user.type(dialog.getByLabelText('Issued on'), '2026-09-15');
    await user.type(dialog.getByLabelText('Model'), 'VR360');
    await user.type(dialog.getByLabelText('Serial from'), '10000');
    await user.click(dialog.getByRole('button', { name: 'Save draft' }));

    await waitFor(() =>
      expect(mocked.createBulletin).toHaveBeenCalledWith('token-1', {
        manufacturer: 'PD',
        reference: 'SB-9',
        title: 'Handle check',
        summary: 'Handles may crack',
        requiredAction: 'Replace cracked handles',
        issuedOn: '2026-09-15',
        severity: 'mandatory',
        targets: [{ model: 'VR360', serialFrom: '10000' }],
      }),
    );
    await waitFor(() => expect(mocked.listBulletins).toHaveBeenCalledTimes(2));
  });

  test('warns that a grounding bulletin grounds every matched rig when it is published', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('SB-2026-01');

    await user.click(screen.getByRole('button', { name: 'New bulletin' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.click(dialog.getByRole('combobox', { name: 'Severity' }));
    await user.click(screen.getByRole('option', { name: 'Grounding' }));

    expect(dialog.getByText(/grounds every matched rig/i)).toBeInTheDocument();
  });

  test('a target row can be added and removed', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('SB-2026-01');

    await user.click(screen.getByRole('button', { name: 'New bulletin' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Add another target' }));

    expect(dialog.getAllByLabelText('Model')).toHaveLength(2);
    await user.click(dialog.getAllByRole('button', { name: 'Remove target' })[0] as HTMLElement);
    expect(dialog.getAllByLabelText('Model')).toHaveLength(1);
  });

  test('publishing reports how many components it matched', async () => {
    const user = userEvent.setup();
    mocked.publishBulletin.mockResolvedValue(bulletin({ status: 'published', matchCounts: { open: 4, total: 4 } }));
    renderPage();
    const draft = (await screen.findByText('SB-2026-01')).closest('tr') as HTMLElement;

    await user.click(within(draft).getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(mocked.publishBulletin).toHaveBeenCalledWith('token-1', 'b1'));
    expect(await screen.findByText(/matched 4 components/i)).toBeInTheDocument();
  });

  test('a published bulletin can be withdrawn, a draft cannot', async () => {
    const user = userEvent.setup();
    mocked.withdrawBulletin.mockResolvedValue(bulletin({ id: 'b2', status: 'withdrawn' }));
    renderPage();
    const live = (await screen.findByText('SB-LIVE')).closest('tr') as HTMLElement;
    const draft = screen.getByText('SB-2026-01').closest('tr') as HTMLElement;

    expect(within(draft).queryByRole('button', { name: 'Withdraw' })).not.toBeInTheDocument();
    await user.click(within(live).getByRole('button', { name: 'Withdraw' }));

    await waitFor(() => expect(mocked.withdrawBulletin).toHaveBeenCalledWith('token-1', 'b2'));
  });

  test('shows the error when saving fails', async () => {
    const user = userEvent.setup();
    mocked.createBulletin.mockRejectedValue(new Error('Boom'));
    renderPage();
    await screen.findByText('SB-2026-01');

    await user.click(screen.getByRole('button', { name: 'New bulletin' }));
    const dialog = within(screen.getByRole('dialog'));
    for (const [label, value] of [
      ['Manufacturer', 'PD'],
      ['Reference', 'SB-9'],
      ['Title', 'T'],
      ['Summary', 'S'],
      ['Required action', 'A'],
    ] as const) {
      await user.type(dialog.getByLabelText(label), value);
    }
    await user.type(dialog.getByLabelText('Issued on'), '2026-09-15');
    await user.click(dialog.getByRole('button', { name: 'Save draft' }));

    expect(await dialog.findByText('Boom')).toBeInTheDocument();
  });
});
