import { Role, type BulletinMatchView } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as api from './bulletins-api';
import { BulletinMatchesPage } from './BulletinMatchesPage';

jest.mock('../../auth/use-auth');
jest.mock('./bulletins-api');

const mocked = jest.mocked(api);

function match(id: string, overrides: Partial<BulletinMatchView> = {}): BulletinMatchView {
  return {
    id,
    bulletin: {
      id: 'b1',
      manufacturer: 'PD',
      reference: 'SB-1',
      title: 'Slider grommet check',
      severity: 'mandatory',
      requiredAction: 'Inspect and replace the grommet',
      sourceUrl: 'https://pd.example/sb-1',
    },
    confidence: 'exact',
    status: 'open',
    resolutionNote: null,
    resolvedAt: null,
    owner: { id: 'o1', displayName: 'Salta en Rosario' },
    rig: { id: 'micro-3', name: 'Micro 3' },
    item: { id: 'reserve-1', kind: 'reserve', manufacturer: 'PD', model: 'VR360', serial: '10586' },
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
      <BulletinMatchesPage />
    </MemoryRouter>,
  );
}

describe('BulletinMatchesPage', () => {
  beforeEach(() => {
    mocked.listMatches.mockResolvedValue([
      match('m1'),
      match('m2', {
        confidence: 'needs_review',
        rig: null,
        owner: { id: 'o2', displayName: 'Ana' },
        item: { id: 'aad-1', kind: 'aad', manufacturer: 'PD', model: 'Vigil 2', serial: 'X-77' },
      }),
    ]);
  });

  test('asks for the open matches and groups them under their bulletin with what it asks for', async () => {
    renderPage();

    const group = await screen.findByRole('region', { name: 'SB-1' });
    expect(mocked.listMatches).toHaveBeenCalledWith('token-1', 'open');
    expect(within(group).getByText('Slider grommet check')).toBeInTheDocument();
    expect(within(group).getByText('Mandatory')).toBeInTheDocument();
    expect(within(group).getByText('Inspect and replace the grommet')).toBeInTheDocument();
    expect(within(group).getByRole('link', { name: 'Manufacturer bulletin' })).toHaveAttribute(
      'href',
      'https://pd.example/sb-1',
    );
  });

  test('each row names the owner, rig and component, and flags a match that needs review', async () => {
    renderPage();

    const row = (await screen.findByText('Micro 3')).closest('tr') as HTMLElement;
    expect(within(row).getByText('Salta en Rosario')).toBeInTheDocument();
    expect(within(row).getByText(/PD VR360/)).toBeInTheDocument();
    expect(within(row).queryByText('Needs review')).not.toBeInTheDocument();
    const spare = screen.getByText('Ana').closest('tr') as HTMLElement;
    expect(within(spare).getByText('Needs review')).toBeInTheDocument();
    expect(within(spare).getByText('Spare gear')).toBeInTheDocument();
  });

  test('resolves a match as complied with a note', async () => {
    const user = userEvent.setup();
    mocked.resolveMatch.mockResolvedValue(match('m1', { status: 'complied' }));
    renderPage();
    const row = (await screen.findByText('Micro 3')).closest('tr') as HTMLElement;

    await user.click(within(row).getByRole('button', { name: 'Resolve' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('What was done'), 'Grommet replaced');
    await user.click(dialog.getByRole('button', { name: 'Mark complied' }));

    await waitFor(() =>
      expect(mocked.resolveMatch).toHaveBeenCalledWith('token-1', 'm1', {
        status: 'complied',
        note: 'Grommet replaced',
      }),
    );
    await waitFor(() => expect(mocked.listMatches).toHaveBeenCalledTimes(2));
  });

  test('can mark a match not applicable, which needs a reason', async () => {
    const user = userEvent.setup();
    mocked.resolveMatch.mockResolvedValue(match('m2', { status: 'not_applicable' }));
    renderPage();
    const row = (await screen.findByText('Ana')).closest('tr') as HTMLElement;

    await user.click(within(row).getByRole('button', { name: 'Resolve' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Not applicable' }));
    await user.click(dialog.getByRole('button', { name: 'Mark not applicable' }));
    expect(await dialog.findByText('Say why it does not apply.')).toBeInTheDocument();
    expect(mocked.resolveMatch).not.toHaveBeenCalled();

    await user.type(dialog.getByLabelText('Why it does not apply'), 'Serial format differs from the range');
    await user.click(dialog.getByRole('button', { name: 'Mark not applicable' }));

    await waitFor(() =>
      expect(mocked.resolveMatch).toHaveBeenCalledWith('token-1', 'm2', {
        status: 'not_applicable',
        note: 'Serial format differs from the range',
      }),
    );
  });

  test('grounds the rig, or the component when it has no rig, in two taps', async () => {
    const user = userEvent.setup();
    mocked.openGrounding.mockResolvedValue({} as never);
    renderPage();
    const rigRow = (await screen.findByText('Micro 3')).closest('tr') as HTMLElement;

    await user.click(within(rigRow).getByRole('button', { name: 'Ground rig' }));
    await user.type(within(screen.getByRole('dialog')).getByLabelText('Reason'), 'Bulletin SB-1 applies');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Ground' }));
    await waitFor(() =>
      expect(mocked.openGrounding).toHaveBeenCalledWith('token-1', {
        rigId: 'micro-3',
        reason: 'Bulletin SB-1 applies',
      }),
    );

    const spareRow = screen.getByText('Ana').closest('tr') as HTMLElement;
    await user.click(within(spareRow).getByRole('button', { name: 'Ground component' }));
    await user.type(within(screen.getByRole('dialog')).getByLabelText('Reason'), 'Serial cannot be checked');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Ground' }));
    await waitFor(() =>
      expect(mocked.openGrounding).toHaveBeenLastCalledWith('token-1', {
        gearItemId: 'aad-1',
        reason: 'Serial cannot be checked',
      }),
    );
  });

  test('can include the resolved matches', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('region', { name: 'SB-1' });

    await user.click(screen.getByRole('checkbox', { name: 'Show resolved matches too' }));

    await waitFor(() => expect(mocked.listMatches).toHaveBeenLastCalledWith('token-1', undefined));
  });

  test('says so when there is nothing to review', async () => {
    mocked.listMatches.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/No open matches/)).toBeInTheDocument();
  });

  test('shows the error when the matches cannot be loaded', async () => {
    mocked.listMatches.mockRejectedValue(new Error('Boom'));
    renderPage();

    expect(await screen.findByText('Boom')).toBeInTheDocument();
  });
});
