import { Role } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as bulletinApi from '../bulletins/bulletins-api';
import * as packingApi from '../packing/packing-api';
import * as photoApi from '../rigphotos/rig-photos-api';
import { entryView, gearItem, groundingView, pending, rigDetail } from './fixtures';
import * as api from './gear-api';
import { RigPage } from './RigPage';

jest.mock('../../auth/use-auth');
jest.mock('./gear-api');
jest.mock('../bulletins/bulletins-api');
jest.mock('../packing/packing-api');
jest.mock('../rigphotos/rig-photos-api');
jest.mock('../rigphotos/AuthedImage', () => ({
  AuthedImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const mocked = jest.mocked(api);

function groundedRig() {
  const unverified = entryView();
  const reserve = gearItem('reserve', {
    id: 'reserve-1',
    rigId: 'micro-3',
    status: 'ok',
    dues: [{ kind: 'repack', dueOn: '2027-03-09', daysLeft: 171, status: 'ok' }],
    pendingVerification: [pending()],
  });
  return rigDetail('Micro 3', {
    id: 'micro-3',
    slots: { container: null, main: null, reserve, aad: null },
    readiness: { state: 'grounded', reasons: [{ type: 'pending_verification', entries: [pending()] }] },
    entries: [
      unverified,
      entryView({
        id: 'entry-0',
        kind: 'assembly',
        description: 'Assigned to rig Micro 3',
        ownerReported: false,
        performedByName: 'Salta en Rosario',
        performedByContact: null,
        performedOn: '2026-09-01',
      }),
      entryView({
        id: 'entry-x',
        description: 'Old repack',
        voidedAt: '2026-05-02T00:00:00.000Z',
        voidReason: 'wrong date',
        performedOn: '2026-01-05',
      }),
    ],
  });
}

function renderPage(role: Role) {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'owner-1',
      email: 'a@b.c',
      displayName: 'Someone',
      role,
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
    <MemoryRouter initialEntries={['/app/gear/micro-3']}>
      <Routes>
        <Route path="/app/gear/:rigId" element={<RigPage />} />
        <Route path="/app/gear/:rigId/packing/:sheetId" element={<p>Pack job page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function inspected(result: 'passed' | 'needs_work' | 'grounded') {
  return {
    entryId: 'insp-1',
    gearItemId: 'reserve-1',
    performedOn: '2026-09-15',
    result,
    performedByName: 'Eca Rigger',
    description: 'Cracked pilot chute handle',
  } as const;
}

const bulletins = jest.mocked(bulletinApi);

beforeEach(() => {
  jest.mocked(packingApi.listSheets).mockResolvedValue([]);
  jest.mocked(photoApi.listPhotos).mockResolvedValue([]);
});

function groundedByRigger(overrides: Parameters<typeof rigDetail>[1] = {}) {
  const grounding = groundingView();
  return rigDetail('Micro 3', {
    id: 'micro-3',
    readiness: { state: 'grounded', reasons: [{ type: 'grounding', grounding }] },
    groundingHistory: [grounding],
    ...overrides,
  });
}

describe('RigPage groundings and bulletins', () => {
  beforeEach(() => {
    mocked.listModels.mockResolvedValue([]);
  });

  test('shows a grounding with its reason, who opened it and when, to the dropzone that owns the rig', async () => {
    mocked.getRig.mockResolvedValue(groundedByRigger());
    renderPage(Role.Dropzone);

    const banner = await screen.findByRole('alert');
    expect(within(banner).getByText('GROUNDED')).toBeInTheDocument();
    expect(within(banner).getByText(/Frayed cutaway handle/)).toBeInTheDocument();
    expect(within(banner).getByText(/Eca Rigger/)).toBeInTheDocument();
    expect(within(banner).getByText(/2026-09-18/)).toBeInTheDocument();
    expect(within(banner).getByText(/advisory/i)).toBeInTheDocument();
    expect(within(banner).queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  test('a rigger can clear a manual grounding with a note', async () => {
    const user = userEvent.setup();
    bulletins.closeGrounding.mockResolvedValue({} as never);
    mocked.getRig.mockResolvedValue(groundedByRigger());
    renderPage(Role.Rigger);
    const banner = await screen.findByRole('alert');

    await user.click(within(banner).getByRole('button', { name: 'Clear' }));
    await user.type(within(screen.getByRole('dialog')).getByLabelText('What was done'), 'Handle replaced');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Clear grounding' }));

    await waitFor(() =>
      expect(bulletins.closeGrounding).toHaveBeenCalledWith('token-1', 'g1', { note: 'Handle replaced' }),
    );
    await waitFor(() => expect(mocked.getRig).toHaveBeenCalledTimes(2));
  });

  test('a grounding a bulletin opened cannot be cleared here: it points to the bulletins page', async () => {
    const grounding = groundingView({
      id: 'g2',
      source: 'bulletin',
      bulletinMatchId: 'm1',
      reason: 'Bulletin SB-1 (PD): Slider check',
    });
    mocked.getRig.mockResolvedValue(
      groundedByRigger({
        readiness: { state: 'grounded', reasons: [{ type: 'grounding', grounding }] },
        groundingHistory: [grounding],
      }),
    );
    renderPage(Role.Rigger);

    const banner = await screen.findByRole('alert');
    expect(within(banner).getByText(/Bulletin SB-1 \(PD\): Slider check/)).toBeInTheDocument();
    expect(within(banner).queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    expect(within(banner).getByRole('link', { name: 'Resolve it in Service bulletins' })).toHaveAttribute(
      'href',
      '/app/work/bulletins',
    );
  });

  test('a rigger can ground the rig from its page, an owner cannot', async () => {
    const user = userEvent.setup();
    bulletins.openGrounding.mockResolvedValue({} as never);
    mocked.getRig.mockResolvedValue(rigDetail('Micro 3', { id: 'micro-3' }));
    renderPage(Role.Rigger);

    await user.click(await screen.findByRole('button', { name: 'Ground rig' }));
    await user.type(within(screen.getByRole('dialog')).getByLabelText('Reason'), 'Reserve pin looks bent');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Ground' }));

    await waitFor(() =>
      expect(bulletins.openGrounding).toHaveBeenCalledWith('token-1', {
        rigId: 'micro-3',
        reason: 'Reserve pin looks bent',
      }),
    );
  });

  test('an owner never sees the ground buttons', async () => {
    mocked.getRig.mockResolvedValue(
      rigDetail('Micro 3', {
        id: 'micro-3',
        slots: {
          container: null,
          main: null,
          aad: null,
          reserve: gearItem('reserve', { id: 'reserve-1', rigId: 'micro-3' }),
        },
      }),
    );
    renderPage(Role.Dropzone);
    await screen.findByRole('heading', { name: 'Micro 3' });

    expect(screen.queryByRole('button', { name: 'Ground rig' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ground reserve' })).not.toBeInTheDocument();
  });

  test('a rigger can ground a single component', async () => {
    const user = userEvent.setup();
    bulletins.openGrounding.mockResolvedValue({} as never);
    mocked.getRig.mockResolvedValue(
      rigDetail('Micro 3', {
        id: 'micro-3',
        slots: {
          container: null,
          main: null,
          aad: null,
          reserve: gearItem('reserve', { id: 'reserve-1', rigId: 'micro-3' }),
        },
      }),
    );
    renderPage(Role.Rigger);

    await user.click(await screen.findByRole('button', { name: 'Ground reserve' }));
    await user.type(within(screen.getByRole('dialog')).getByLabelText('Reason'), 'Slider grommet loose');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Ground' }));

    await waitFor(() =>
      expect(bulletins.openGrounding).toHaveBeenCalledWith('token-1', {
        gearItemId: 'reserve-1',
        reason: 'Slider grommet loose',
      }),
    );
  });

  test('lists the grounding history with who cleared it and what was done', async () => {
    const closed = groundingView({
      id: 'g0',
      reason: 'Old problem',
      closedByName: 'Lucia Rigger',
      closedAt: '2026-09-10T10:00:00.000Z',
      closeNote: 'Replaced the handle',
    });
    mocked.getRig.mockResolvedValue(rigDetail('Micro 3', { id: 'micro-3', groundingHistory: [closed] }));
    renderPage(Role.Dropzone);

    const history = await screen.findByRole('table', { name: 'Grounding history' });
    expect(within(history).getByText('Old problem')).toBeInTheDocument();
    expect(within(history).getByText(/Lucia Rigger/)).toBeInTheDocument();
    expect(within(history).getByText('Replaced the handle')).toBeInTheDocument();
  });

  test('shows the open service bulletins on a component, flagging the ones to review', async () => {
    const reserve = gearItem('reserve', {
      id: 'reserve-1',
      rigId: 'micro-3',
      bulletins: [
        {
          matchId: 'm1',
          bulletinId: 'b1',
          reference: 'SB-1',
          title: 'Slider grommet check',
          severity: 'mandatory',
          confidence: 'exact',
        },
        {
          matchId: 'm2',
          bulletinId: 'b2',
          reference: 'SB-2',
          title: 'Handle check',
          severity: 'advisory',
          confidence: 'needs_review',
        },
      ],
    });
    mocked.getRig.mockResolvedValue(
      rigDetail('Micro 3', { id: 'micro-3', slots: { container: null, main: null, aad: null, reserve } }),
    );
    renderPage(Role.Dropzone);

    const card = await screen.findByTestId('slot-reserve');
    expect(within(card).getByText(/SB-1/)).toBeInTheDocument();
    expect(within(card).getByText(/Slider grommet check/)).toBeInTheDocument();
    expect(within(card).getByText('Mandatory')).toBeInTheDocument();
    expect(within(card).getByText('Needs review')).toBeInTheDocument();
  });
});

describe('RigPage inspections and riggers', () => {
  beforeEach(() => {
    mocked.listModels.mockResolvedValue([]);
  });

  test('shows the last inspection with its date, result and rigger, and the riggers linked to the owner', async () => {
    mocked.getRig.mockResolvedValue(
      rigDetail('Micro 3', {
        id: 'micro-3',
        lastInspection: inspected('passed'),
        riggers: [
          { id: 'r1', displayName: 'Eca Rigger' },
          { id: 'r2', displayName: 'Lucia' },
        ],
      }),
    );
    renderPage(Role.Dropzone);

    const block = await screen.findByRole('region', { name: 'Last inspection' });
    expect(within(block).getByText(/2026-09-15/)).toBeInTheDocument();
    expect(within(block).getByText('Passed')).toBeInTheDocument();
    expect(within(block).getByText(/by Eca Rigger/)).toBeInTheDocument();
    expect(within(block).getByText(/Riggers: Eca Rigger, Lucia/)).toBeInTheDocument();
  });

  test('a rig nobody inspected says so', async () => {
    mocked.getRig.mockResolvedValue(rigDetail('Micro 3', { id: 'micro-3' }));
    renderPage(Role.Dropzone);

    const block = await screen.findByRole('region', { name: 'Last inspection' });
    expect(within(block).getByText('Never inspected')).toBeInTheDocument();
    expect(within(block).getByText(/No rigger linked yet/)).toBeInTheDocument();
  });

  test('a grounded inspection shows a banner with the reason and no Verify button, saying a passed inspection clears it', async () => {
    mocked.getRig.mockResolvedValue(
      rigDetail('Micro 3', {
        id: 'micro-3',
        lastInspection: inspected('grounded'),
        readiness: { state: 'grounded', reasons: [{ type: 'inspection_grounded', inspection: inspected('grounded') }] },
      }),
    );
    renderPage(Role.Admin);

    const banner = await screen.findByRole('alert');
    expect(within(banner).getByText(/Cracked pilot chute handle/)).toBeInTheDocument();
    expect(within(banner).getByText(/Eca Rigger/)).toBeInTheDocument();
    expect(within(banner).getByText(/passed inspection/i)).toBeInTheDocument();
    expect(within(banner).queryByRole('button', { name: 'Verify' })).not.toBeInTheDocument();
  });
});

describe('RigPage', () => {
  beforeEach(() => {
    mocked.getRig.mockResolvedValue(groundedRig());
    mocked.listModels.mockResolvedValue([]);
  });

  test('shows a GROUNDED banner saying who packed it, their contact, and that a rigger must verify', async () => {
    renderPage(Role.Dropzone);

    const banner = await screen.findByRole('alert');
    expect(within(banner).getByText(/GROUNDED/)).toBeInTheDocument();
    expect(within(banner).getByText(/Carlos Packer/)).toBeInTheDocument();
    expect(within(banner).getByText(/\+54 9 341 555 0000/)).toBeInTheDocument();
    expect(within(banner).getByText(/rigger must verify/i)).toBeInTheDocument();
  });

  test('the owner cannot verify: no Verify button', async () => {
    renderPage(Role.Dropzone);
    await screen.findByRole('alert');

    expect(screen.queryByRole('button', { name: 'Verify' })).not.toBeInTheDocument();
  });

  test('an admin verifies the entry and the page reloads', async () => {
    const user = userEvent.setup();
    mocked.verifyEntry.mockResolvedValue(entryView({ verifiedAt: '2026-09-19T12:00:00.000Z' }));
    renderPage(Role.Admin);
    await screen.findByRole('alert');

    await user.click(screen.getAllByRole('button', { name: 'Verify' })[0] as HTMLElement);

    await waitFor(() => expect(mocked.verifyEntry).toHaveBeenCalledWith('token-1', 'entry-1'));
    await waitFor(() => expect(mocked.getRig).toHaveBeenCalledTimes(2));
  });

  test('the history marks unverified work, and shows voided entries struck through with their reason', async () => {
    const user = userEvent.setup();
    renderPage(Role.Dropzone);
    await user.click(await screen.findByRole('button', { name: 'Table' }));

    const history = await screen.findByRole('table', { name: 'Maintenance history' });
    expect(within(history).getByText('Unverified')).toBeInTheDocument();
    expect(within(history).getByText(/Voided: wrong date/)).toBeInTheDocument();
    expect(within(history).getByText('Old repack')).toHaveStyle({ textDecoration: 'line-through' });
  });

  test('empty slots offer Add for that kind and a component slot offers Log work', async () => {
    renderPage(Role.Dropzone);
    await screen.findByRole('alert');

    expect(screen.getByRole('button', { name: 'Add AAD' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add container' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log work on reserve' })).toBeInTheDocument();
  });

  test('a rig of another account shows the unavailable message', async () => {
    mocked.getRig.mockRejectedValue(new Error('Rig not found'));
    renderPage(Role.User);

    expect(await screen.findByText(/not available/i)).toBeInTheDocument();
  });
});

describe('RigPage start repack', () => {
  const withReserve = (overrides: Parameters<typeof rigDetail>[1] = {}) =>
    rigDetail('Micro 3', {
      id: 'micro-3',
      slots: {
        container: null,
        main: null,
        aad: null,
        reserve: gearItem('reserve', { id: 'reserve-1', rigId: 'micro-3' }),
      },
      ...overrides,
    });

  beforeEach(() => {
    mocked.listModels.mockResolvedValue([]);
    mocked.getRig.mockResolvedValue(withReserve());
  });

  test('a rigger starts a pack job and lands on the job page', async () => {
    const user = userEvent.setup();
    jest.mocked(packingApi.startSheet).mockResolvedValue({ sheet: { id: 'sheet-9' } } as never);
    renderPage(Role.Rigger);

    await user.click(await screen.findByRole('button', { name: 'Start repack' }));

    expect(packingApi.startSheet).toHaveBeenCalledWith('token-1', 'micro-3');
    expect(await screen.findByText('Pack job page')).toBeInTheDocument();
  });

  test('an admin sees it too', async () => {
    renderPage(Role.Admin);

    expect(await screen.findByRole('button', { name: 'Start repack' })).toBeInTheDocument();
  });

  test.each([Role.User, Role.Dropzone])('a %s does not see it', async (role) => {
    renderPage(role);
    await screen.findByRole('heading', { name: 'Micro 3' });

    expect(screen.queryByRole('button', { name: 'Start repack' })).not.toBeInTheDocument();
  });

  test('is not offered for a rig with no reserve or for an inactive rig', async () => {
    mocked.getRig.mockResolvedValue(rigDetail('Micro 3', { id: 'micro-3' }));
    renderPage(Role.Rigger);
    await screen.findByRole('heading', { name: 'Micro 3' });
    expect(screen.queryByRole('button', { name: 'Start repack' })).not.toBeInTheDocument();
  });

  test('shows why a pack job could not be started', async () => {
    const user = userEvent.setup();
    jest.mocked(packingApi.startSheet).mockRejectedValue(new Error('This rig has no reserve to pack'));
    renderPage(Role.Rigger);

    await user.click(await screen.findByRole('button', { name: 'Start repack' }));

    expect(await screen.findByText('This rig has no reserve to pack')).toBeInTheDocument();
  });
});

describe('RigPage packing log', () => {
  test('lists the signed packing sheets of the rig, newest first', async () => {
    mocked.listModels.mockResolvedValue([]);
    mocked.getRig.mockResolvedValue(rigDetail('Micro 3', { id: 'micro-3' }));
    jest.mocked(packingApi.listSheets).mockResolvedValue([
      {
        id: 'sheet-2',
        rigId: 'micro-3',
        rigName: 'Micro 3',
        reserveItemId: 'reserve-1',
        entryId: 'entry-2',
        sheetNo: 2,
        performedOn: '2026-09-10',
        riggerName: 'Eca Rigger',
        missingCount: 1,
        voided: false,
        signedAt: '2026-09-10T12:00:00.000Z',
      },
    ]);
    renderPage(Role.Dropzone);

    const table = await screen.findByRole('table', { name: 'Reserve packing log' });
    expect(within(table).getByText('Eca Rigger')).toBeInTheDocument();
    expect(packingApi.listSheets).toHaveBeenCalledWith('token-1', { rigId: 'micro-3' });
  });
});

describe('RigPage photos', () => {
  const rigPhoto = {
    id: 'photo-1',
    rigId: 'micro-3',
    entryId: null,
    fileName: 'front.jpg',
    sizeBytes: 1000,
    caption: 'Front view',
    addedById: 'owner-1',
    addedByName: 'Someone',
    createdAt: '2026-09-12T10:00:00.000Z',
  };

  beforeEach(() => {
    mocked.listModels.mockResolvedValue([]);
    mocked.getRig.mockResolvedValue(rigDetail('Micro 3', { id: 'micro-3' }));
  });

  test('shows the rig photos and the newest as its cover', async () => {
    jest.mocked(photoApi.listPhotos).mockResolvedValue([rigPhoto]);
    renderPage(Role.Dropzone);

    const gallery = await screen.findByRole('region', { name: 'Photos' });
    expect(await within(gallery).findByText('Front view')).toBeInTheDocument();
    expect(photoApi.listPhotos).toHaveBeenCalledWith('token-1', 'micro-3');
    expect(await screen.findByRole('img', { name: 'Photo of Micro 3' })).toBeInTheDocument();
  });

  test.each([Role.User, Role.Rigger, Role.Dropzone])('a %s can add a photo', async (role) => {
    renderPage(role);

    expect(await screen.findByRole('button', { name: 'Add photo' })).toBeInTheDocument();
  });

  test('the owner can remove a photo someone else added', async () => {
    const user = userEvent.setup();
    jest.mocked(photoApi.listPhotos).mockResolvedValue([{ ...rigPhoto, addedById: 'rigger-9', addedByName: 'Rigger' }]);
    jest.mocked(photoApi.removePhoto).mockResolvedValue();
    renderPage(Role.Dropzone);

    const gallery = await screen.findByRole('region', { name: 'Photos' });
    await user.click(await within(gallery).findByRole('button', { name: 'Open photo: Front view' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove photo' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Yes, remove it' }));

    await waitFor(() => expect(photoApi.removePhoto).toHaveBeenCalledWith('token-1', 'photo-1'));
    await waitFor(() => expect(photoApi.listPhotos).toHaveBeenCalledTimes(2));
  });
});

describe('RigPage history', () => {
  beforeEach(() => {
    mocked.listModels.mockResolvedValue([]);
  });

  test('shows the timeline first, and the table with its actions one click away', async () => {
    const user = userEvent.setup();
    mocked.getRig.mockResolvedValue(groundedRig());
    renderPage(Role.Dropzone);

    expect(await screen.findByRole('list', { name: 'Rig history' })).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Maintenance history' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Table' }));
    expect(screen.getByRole('table', { name: 'Maintenance history' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Rig history' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Timeline' }));
    expect(screen.getByRole('list', { name: 'Rig history' })).toBeInTheDocument();
  });

  test('the timeline includes the groundings of the rig', async () => {
    const grounding = groundingView({ reason: 'Bent reserve pin', closedAt: null });
    mocked.getRig.mockResolvedValue(
      rigDetail('Micro 3', { id: 'micro-3', groundingHistory: [grounding], entries: [] }),
    );
    renderPage(Role.Dropzone);

    const timeline = await screen.findByRole('list', { name: 'Rig history' });
    expect(within(timeline).getByText('Bent reserve pin')).toBeInTheDocument();
  });
});
