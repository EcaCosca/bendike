import {
  AUTHORITY_PAGE_SIZE,
  Role,
  type AuthorityGroundingRow,
  type AuthoritySheetRow,
  type AuthorityWorkRow,
  type RiggerRegistryRow,
} from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as api from './authority-api';
import { AuthorityRiggerPage } from './AuthorityRiggerPage';

jest.mock('../../auth/use-auth');
jest.mock('./authority-api');

const mocked = jest.mocked(api);

const rigger: RiggerRegistryRow = {
  id: 'r1',
  displayName: 'Eca Rigger',
  email: 'eca@bendike.example',
  phone: '+5493415550001',
  licence: 'AR-1234',
  signedSheets: 12,
  workRecorded: 30,
  lastActivityAt: '2026-09-18T15:00:00.000Z',
  customers: 4,
};

const sheet: AuthoritySheetRow = {
  id: 's7',
  rigId: 'rig-1',
  rigName: 'Tandem 1',
  sheetNo: 7,
  performedOn: '2026-09-19',
  ownerName: 'Ana Skydiver',
  missingCount: 2,
  voided: false,
  signedAt: '2026-09-19T15:00:00.000Z',
};

const work: AuthorityWorkRow = {
  id: 'w1',
  relation: 'performed',
  performedOn: '2026-09-10',
  kind: 'repack',
  result: null,
  componentLabel: 'Reserve UPT Vector Sigma Reserve',
  rigName: 'Tandem 1',
  ownerName: 'Ana Skydiver',
  description: 'Reserve repack, all checks done',
  voided: false,
  voidReason: null,
};

const grounding: AuthorityGroundingRow = {
  id: 'g1',
  rigId: 'rig-1',
  rigName: 'Tandem 1',
  gearItemId: null,
  reason: 'Worn closing loop',
  source: 'manual',
  bulletinMatchId: null,
  openedByName: 'Eca Rigger',
  openedAt: '2026-09-01T12:00:00.000Z',
  closedByName: 'Eca Rigger',
  closedAt: '2026-09-02T12:00:00.000Z',
  closeNote: 'Loop replaced',
};

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
    <MemoryRouter initialEntries={['/app/authority/riggers/r1']}>
      <Routes>
        <Route path="/app/authority/riggers/:riggerId" element={<AuthorityRiggerPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  mocked.getRigger.mockResolvedValue(rigger);
  mocked.getRiggerSheets.mockResolvedValue({ rows: [sheet], total: 1 });
  mocked.getRiggerWork.mockResolvedValue({ rows: [work], total: 1 });
  mocked.getRiggerGroundings.mockResolvedValue({ rows: [grounding], total: 1 });
});

describe('AuthorityRiggerPage', () => {
  it("shows the rigger's details", async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Eca Rigger' })).toBeInTheDocument();
    expect(screen.getByText('eca@bendike.example')).toBeInTheDocument();
    expect(screen.getByText('+5493415550001')).toBeInTheDocument();
    expect(screen.getByText('Licence AR-1234')).toBeInTheDocument();
    expect(screen.getByText('4 customers')).toBeInTheDocument();
    expect(mocked.getRigger).toHaveBeenCalledWith('token-1', 'r1');
  });

  it('lists the signed sheets first and opens one as signed', async () => {
    renderPage();
    const link = await screen.findByRole('link', { name: '7' });
    expect(link).toHaveAttribute('href', '/app/gear/rig-1/packing/s7/print');
    const row = link.closest('tr') as HTMLElement;
    expect(within(row).getByText('2026-09-19')).toBeInTheDocument();
    expect(within(row).getByText('Tandem 1')).toBeInTheDocument();
    expect(within(row).getByText('Ana Skydiver')).toBeInTheDocument();
    expect(within(row).getByText('2 items not complete')).toBeInTheDocument();
    expect(mocked.getRiggerSheets).toHaveBeenCalledWith('token-1', 'r1', 1);
    expect(mocked.getRiggerSheets).toHaveBeenCalledTimes(1);
  });

  it('marks a void sheet and a complete one', async () => {
    mocked.getRiggerSheets.mockResolvedValue({
      rows: [
        { ...sheet, voided: true },
        { ...sheet, id: 's8', sheetNo: 8, missingCount: 0 },
      ],
      total: 2,
    });
    renderPage();
    const voided = (await screen.findByRole('link', { name: '7' })).closest('tr') as HTMLElement;
    expect(within(voided).getByText('Void')).toBeInTheDocument();
    const complete = screen.getByRole('link', { name: '8' }).closest('tr') as HTMLElement;
    expect(within(complete).getByText('Complete')).toBeInTheDocument();
  });

  it('shows the work recorded, performed or verified', async () => {
    mocked.getRiggerWork.mockResolvedValue({
      rows: [
        work,
        {
          ...work,
          id: 'w2',
          relation: 'verified',
          kind: 'inspection',
          result: 'passed',
          description: 'Second look',
          voided: true,
          voidReason: 'Wrong rig',
        },
      ],
      total: 2,
    });
    renderPage();
    await userEvent.click(await screen.findByRole('tab', { name: 'Work recorded' }));
    const performed = (await screen.findByText('Reserve repack, all checks done')).closest('tr') as HTMLElement;
    expect(within(performed).getByText('Performed')).toBeInTheDocument();
    expect(within(performed).getByText('Repack')).toBeInTheDocument();
    expect(within(performed).getByText('Reserve UPT Vector Sigma Reserve')).toBeInTheDocument();
    expect(within(performed).getByText('2026-09-10')).toBeInTheDocument();
    const verified = screen.getByText('Second look').closest('tr') as HTMLElement;
    expect(within(verified).getByText('Verified')).toBeInTheDocument();
    expect(within(verified).getByText('Void: Wrong rig')).toBeInTheDocument();
    expect(mocked.getRiggerWork).toHaveBeenCalledWith('token-1', 'r1', 1);
  });

  it('shows the groundings, cleared or still open', async () => {
    mocked.getRiggerGroundings.mockResolvedValue({
      rows: [
        grounding,
        { ...grounding, id: 'g2', reason: 'Bulletin 12', closedAt: null, closedByName: null, closeNote: null },
      ],
      total: 2,
    });
    renderPage();
    await userEvent.click(await screen.findByRole('tab', { name: 'Groundings' }));
    const cleared = (await screen.findByText('Worn closing loop')).closest('tr') as HTMLElement;
    expect(within(cleared).getByText('Cleared 2026-09-02 by Eca Rigger: Loop replaced')).toBeInTheDocument();
    const open = screen.getByText('Bulletin 12').closest('tr') as HTMLElement;
    expect(within(open).getByText('Still grounded')).toBeInTheDocument();
  });

  it('pages a list and starts again at page one on another tab', async () => {
    mocked.getRiggerSheets.mockResolvedValue({ rows: [sheet], total: AUTHORITY_PAGE_SIZE + 1 });
    renderPage();
    await screen.findByRole('link', { name: '7' });
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));
    await waitFor(() => expect(mocked.getRiggerSheets).toHaveBeenLastCalledWith('token-1', 'r1', 2));
    await userEvent.click(screen.getByRole('tab', { name: 'Work recorded' }));
    await waitFor(() => expect(mocked.getRiggerWork).toHaveBeenCalledWith('token-1', 'r1', 1));
  });

  it('says when a list is empty', async () => {
    mocked.getRiggerSheets.mockResolvedValue({ rows: [], total: 0 });
    renderPage();
    expect(await screen.findByText('No signed sheets yet.')).toBeInTheDocument();
  });

  it('shows the API error when the rigger is not found', async () => {
    mocked.getRigger.mockRejectedValue(new Error('Rigger not found'));
    renderPage();
    expect(await screen.findByText('Rigger not found')).toBeInTheDocument();
  });

  it('links back to the register', async () => {
    renderPage();
    expect(await screen.findByRole('link', { name: 'Back to the riggers' })).toHaveAttribute(
      'href',
      '/app/authority/riggers',
    );
  });
});
