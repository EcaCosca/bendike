import {
  PACKING_CHECKLIST,
  Role,
  type LibraryDocumentView,
  type PackingComponentInfo,
  type PackingJobView,
  type PackingSheetView,
} from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as libraryApi from '../library/library-api';
import * as api from './packing-api';
import { PackingJobPage } from './PackingJobPage';

jest.mock('../../auth/use-auth');
jest.mock('./packing-api');
jest.mock('../library/library-api');

const mocked = jest.mocked(api);
const allIds = PACKING_CHECKLIST.map((item) => item.id);
const LINK = 'https://uptvector.com/product-service-bulletins/';

function manual(overrides: Partial<LibraryDocumentView> = {}): LibraryDocumentView {
  return {
    id: 'doc-1',
    title: 'Sigma II Tandem owners manual',
    kind: 'manual',
    manufacturer: 'UPT Vector',
    modelId: 'model-container',
    modelName: 'Sigma Tandem',
    revision: 'Rev4',
    language: 'en',
    sourceUrl: null,
    fileName: 'm.pdf',
    sizeBytes: 100,
    addedByName: 'Eca',
    createdAt: '2026-09-20T10:00:00.000Z',
    archivedAt: null,
    archiveReason: null,
    ...overrides,
  };
}

function component(kind: 'reserve' | 'container' | 'aad', overrides: Partial<PackingComponentInfo> = {}) {
  const base: Record<string, Partial<PackingComponentInfo>> = {
    reserve: { manufacturer: 'UPT Vector', model: 'Sigma Reserve', serial: 'R-100' },
    container: { manufacturer: 'UPT Vector', model: 'Sigma Tandem', serial: 'C-200', manufacturedOn: '2020-03-01' },
    aad: { manufacturer: 'Vigil', model: 'Vigil 4', serial: 'A-300' },
  };
  return {
    kind,
    itemId: `${kind}-1`,
    manufacturer: '',
    model: '',
    serial: null,
    manufacturedOn: null,
    modelId: null,
    bulletinsLink: null,
    openBulletins: [],
    manuals: [],
    ...base[kind],
    ...overrides,
  };
}

function sheet(overrides: Partial<PackingSheetView> = {}): PackingSheetView {
  return {
    id: 'sheet-1',
    rigId: 'tandem-1',
    rigName: 'Tandem 1',
    reserveItemId: 'reserve-1',
    ownerId: 'owner-1',
    riggerId: 'rigger-1',
    riggerName: 'Eca Rigger',
    riggerLicence: null,
    status: 'draft',
    voided: false,
    voidReason: null,
    sheetNo: null,
    performedOn: '2026-09-20',
    checklistVersion: 'ciac-anac-1',
    checkedIds: [],
    bulletinsChecked: null,
    mardConnected: null,
    ownerName: 'Ana Skydiver',
    ownerAddress: '',
    ownerPhone: '+5493415550000',
    ownerEmail: 'ana@bendike.example',
    manualDocumentId: null,
    manualLabel: null,
    notes: '',
    elements: null,
    missing: null,
    signedAt: null,
    entryId: null,
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
    ...overrides,
  };
}

function job(
  overrides: { sheet?: Partial<PackingSheetView>; components?: Partial<PackingJobView['components']> } = {},
) {
  return {
    sheet: sheet(overrides.sheet),
    components: {
      reserve: component('reserve'),
      container: component('container'),
      aad: component('aad'),
      ...overrides.components,
    },
  };
}

function renderPage() {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'rigger-1',
      email: 'r@b.c',
      displayName: 'Eca Rigger',
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
    <MemoryRouter initialEntries={['/app/gear/tandem-1/packing/sheet-1']}>
      <Routes>
        <Route path="/app/gear/:rigId/packing/:sheetId" element={<PackingJobPage />} />
        <Route path="/app/gear/:rigId/packing/:sheetId/print" element={<p>Print page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PackingJobPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mocked.getSheet.mockResolvedValue(job());
    mocked.saveDraft.mockImplementation((_t, _id, body) => Promise.resolve(job({ sheet: body })));
  });

  afterEach(() => localStorage.clear());

  test('shows the rig, the owner details and the three components with their details', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Repack: Tandem 1' })).toBeInTheDocument();
    expect(screen.getByLabelText('Owner name')).toHaveValue('Ana Skydiver');
    expect(screen.getByLabelText('Owner email')).toHaveValue('ana@bendike.example');
    const container = screen.getByRole('region', { name: 'Container' });
    expect(within(container).getByText(/UPT Vector Sigma Tandem/)).toBeInTheDocument();
    expect(within(container).getByText(/C-200/)).toBeInTheDocument();
    expect(within(container).getByText(/2020-03-01/)).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Reserve' })).getByText(/R-100/)).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'AAD' })).getByText(/Vigil 4/)).toBeInTheDocument();
  });

  describe('bulletins and manuals', () => {
    test("opens the model's bulletins page in a new tab, and says when it is the manufacturer's", async () => {
      mocked.getSheet.mockResolvedValue(
        job({
          components: {
            container: component('container', { bulletinsLink: { url: LINK, source: 'model' } }),
            reserve: component('reserve', { bulletinsLink: { url: LINK, source: 'manufacturer' } }),
          },
        }),
      );
      renderPage();

      const container = await screen.findByRole('region', { name: 'Container' });
      const link = within(container).getByRole('link', { name: /Service bulletins page/ });
      expect(link).toHaveAttribute('href', LINK);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(within(container).queryByText(/manufacturer's page/)).not.toBeInTheDocument();
      expect(
        within(screen.getByRole('region', { name: 'Reserve' })).getByText(/manufacturer's page/),
      ).toBeInTheDocument();
    });

    test('lists the open service bulletins Bendike matched to a component', async () => {
      mocked.getSheet.mockResolvedValue(
        job({
          components: {
            aad: component('aad', {
              openBulletins: [
                {
                  matchId: 'm1',
                  bulletinId: 'b1',
                  reference: 'VG-2026-01',
                  title: 'Battery check',
                  severity: 'advisory',
                  confidence: 'exact',
                } as never,
              ],
            }),
          },
        }),
      );
      renderPage();

      const aad = await screen.findByRole('region', { name: 'AAD' });
      expect(within(aad).getByText(/VG-2026-01/)).toBeInTheDocument();
      expect(within(aad).getByText(/Battery check/)).toBeInTheDocument();
    });

    test('a component in the catalogue with no link lets the rigger paste one, and it appears', async () => {
      const user = userEvent.setup();
      mocked.getSheet
        .mockResolvedValueOnce(
          job({ components: { container: component('container', { modelId: 'model-container' }) } }),
        )
        .mockResolvedValue(
          job({
            components: {
              container: component('container', {
                modelId: 'model-container',
                bulletinsLink: { url: LINK, source: 'model' },
              }),
            },
          }),
        );
      mocked.setBulletinsLink.mockResolvedValue({} as never);
      renderPage();

      const container = await screen.findByRole('region', { name: 'Container' });
      await user.type(within(container).getByLabelText('Bulletins page link'), LINK);
      await user.click(within(container).getByRole('button', { name: 'Save link' }));

      await waitFor(() => expect(mocked.setBulletinsLink).toHaveBeenCalledWith('token-1', 'model-container', LINK));
      expect(await within(container).findByRole('link', { name: /Service bulletins page/ })).toHaveAttribute(
        'href',
        LINK,
      );
    });

    test('refuses a link that is not https, and does not offer a link field for gear outside the catalogue', async () => {
      const user = userEvent.setup();
      mocked.getSheet.mockResolvedValue(
        job({ components: { container: component('container', { modelId: 'model-container' }) } }),
      );
      renderPage();

      const container = await screen.findByRole('region', { name: 'Container' });
      await user.type(within(container).getByLabelText('Bulletins page link'), 'http://x.example');
      await user.click(within(container).getByRole('button', { name: 'Save link' }));
      expect(await within(container).findByText('The link must start with https://')).toBeInTheDocument();
      expect(mocked.setBulletinsLink).not.toHaveBeenCalled();

      const reserve = screen.getByRole('region', { name: 'Reserve' });
      expect(within(reserve).queryByLabelText('Bulletins page link')).not.toBeInTheDocument();
      expect(within(reserve).getByText(/not linked to a catalogue model/i)).toBeInTheDocument();
    });

    test('offers the Library manuals, downloads one and records the one followed', async () => {
      const user = userEvent.setup();
      mocked.getSheet.mockResolvedValue(
        job({ components: { container: component('container', { modelId: 'model-container', manuals: [manual()] }) } }),
      );
      jest.mocked(libraryApi.downloadDocument).mockResolvedValue();
      renderPage();

      const container = await screen.findByRole('region', { name: 'Container' });
      await user.click(within(container).getByRole('button', { name: 'Download Sigma II Tandem owners manual' }));
      expect(jest.mocked(libraryApi.downloadDocument)).toHaveBeenCalledWith(
        'token-1',
        expect.objectContaining({ id: 'doc-1' }),
      );

      await user.click(screen.getByRole('combobox', { name: 'Manual followed' }));
      await user.click(screen.getByRole('option', { name: /Sigma II Tandem owners manual \(Rev4\)/ }));

      await waitFor(() =>
        expect(mocked.saveDraft).toHaveBeenLastCalledWith(
          'token-1',
          'sheet-1',
          expect.objectContaining({ manualDocumentId: 'doc-1' }),
        ),
      );
    });

    test('says so, with a link to the Library, when there are no manuals', async () => {
      renderPage();

      expect(await screen.findByText(/No manual in the Library yet/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Open the Library' })).toHaveAttribute('href', '/app/library');
    });

    test('records whether the bulletins were checked', async () => {
      const user = userEvent.setup();
      renderPage();
      await screen.findByRole('heading', { name: 'Repack: Tandem 1' });

      await user.click(
        within(screen.getByRole('radiogroup', { name: 'Service bulletins checked' })).getByRole('radio', {
          name: 'Yes',
        }),
      );

      await waitFor(() =>
        expect(mocked.saveDraft).toHaveBeenLastCalledWith(
          'token-1',
          'sheet-1',
          expect.objectContaining({ bulletinsChecked: true }),
        ),
      );
    });
  });

  describe('checklist', () => {
    test('shows the 36 items in English and Spanish, and the MARD question', async () => {
      renderPage();

      const checklist = await screen.findByRole('region', { name: 'Checklist' });
      expect(within(checklist).getAllByRole('checkbox')).toHaveLength(36);
      expect(within(checklist).getByText('MARD hooked up')).toBeInTheDocument();
      expect(within(checklist).getByText('MARD enganchado')).toBeInTheDocument();
      expect(within(checklist).getByRole('radiogroup', { name: 'MARD connected' })).toBeInTheDocument();
    });

    test('restores the ticks of the draft and saves a new tick', async () => {
      const user = userEvent.setup();
      mocked.getSheet.mockResolvedValue(job({ sheet: { checkedIds: ['main_lift_web'] } }));
      renderPage();

      const checklist = await screen.findByRole('region', { name: 'Checklist' });
      expect(within(checklist).getByRole('checkbox', { name: /Main lift web/ })).toBeChecked();
      await user.click(within(checklist).getByRole('checkbox', { name: /Bridle/ }));

      await waitFor(() =>
        expect(mocked.saveDraft).toHaveBeenLastCalledWith(
          'token-1',
          'sheet-1',
          expect.objectContaining({ checkedIds: ['main_lift_web', 'bridle'] }),
        ),
      );
      expect(await screen.findByText('Saved')).toBeInTheDocument();
    });

    test('shows when saving fails', async () => {
      const user = userEvent.setup();
      mocked.saveDraft.mockRejectedValue(new Error('Network down'));
      renderPage();
      const checklist = await screen.findByRole('region', { name: 'Checklist' });

      await user.click(within(checklist).getByRole('checkbox', { name: /Bridle/ }));

      expect(await screen.findByText(/Could not save/)).toBeInTheDocument();
    });
  });

  describe('signing', () => {
    async function openSignDialog(user: ReturnType<typeof userEvent.setup>) {
      await screen.findByRole('heading', { name: 'Repack: Tandem 1' });
      await user.click(screen.getByRole('button', { name: 'Review and sign' }));
      return within(screen.getByRole('dialog'));
    }

    const complete = () => job({ sheet: { checkedIds: allIds, bulletinsChecked: true, mardConnected: true } });

    test('a complete sheet signs with the licence number and opens the printable page', async () => {
      const user = userEvent.setup();
      mocked.getSheet.mockResolvedValue(complete());
      mocked.signSheet.mockResolvedValue(sheet({ status: 'signed', sheetNo: 1 }));
      renderPage();

      const dialog = await openSignDialog(user);
      expect(dialog.getByText('Everything is ticked and answered.')).toBeInTheDocument();
      await user.type(dialog.getByLabelText(/Licence number/), 'AR-1234');
      await user.click(dialog.getByRole('button', { name: 'Sign' }));

      await waitFor(() => expect(mocked.signSheet).toHaveBeenCalledWith('token-1', 'sheet-1', 'AR-1234'));
      expect(await screen.findByText('Print page')).toBeInTheDocument();
      expect(localStorage.getItem('bendike.riggerLicence')).toBe('AR-1234');
    });

    test('remembers the licence number for the next sheet', async () => {
      const user = userEvent.setup();
      localStorage.setItem('bendike.riggerLicence', 'AR-9999');
      mocked.getSheet.mockResolvedValue(complete());
      renderPage();

      const dialog = await openSignDialog(user);

      expect(dialog.getByLabelText(/Licence number/)).toHaveValue('AR-9999');
    });

    test('lists everything that is missing and will not sign until the notes explain it', async () => {
      const user = userEvent.setup();
      mocked.getSheet.mockResolvedValue(
        job({
          sheet: {
            checkedIds: allIds.filter((id) => id !== 'mard_hooked'),
            bulletinsChecked: true,
            mardConnected: false,
          },
          components: { aad: null },
        }),
      );
      mocked.signSheet.mockResolvedValue(sheet({ status: 'signed', sheetNo: 1 }));
      renderPage();

      const dialog = await openSignDialog(user);

      expect(dialog.getByText('Not ticked: MARD hooked up')).toBeInTheDocument();
      expect(dialog.getByText('MARD not connected')).toBeInTheDocument();
      expect(dialog.getByText('No AAD on the rig')).toBeInTheDocument();
      await user.type(dialog.getByLabelText(/Licence number/), 'AR-1234');
      expect(dialog.getByRole('button', { name: 'Sign' })).toBeDisabled();
      expect(dialog.getByText(/notes must explain what is missing/)).toBeInTheDocument();

      await user.type(dialog.getByLabelText('Notes'), 'No MARD on this unit');
      expect(dialog.getByRole('button', { name: 'Sign' })).toBeEnabled();
      await user.click(dialog.getByRole('button', { name: 'Sign' }));

      await waitFor(() => expect(mocked.signSheet).toHaveBeenCalledWith('token-1', 'sheet-1', 'AR-1234'));
      const saveOrder = mocked.saveDraft.mock.invocationCallOrder.at(-1) as number;
      expect(saveOrder).toBeLessThan(mocked.signSheet.mock.invocationCallOrder[0] as number);
      expect(mocked.saveDraft).toHaveBeenLastCalledWith(
        'token-1',
        'sheet-1',
        expect.objectContaining({ notes: 'No MARD on this unit' }),
      );
    });

    test('many unticked items are summarised, with the list one click away', async () => {
      const user = userEvent.setup();
      mocked.getSheet.mockResolvedValue(
        job({ sheet: { checkedIds: ['bridle'], bulletinsChecked: true, mardConnected: true } }),
      );
      renderPage();

      const dialog = await openSignDialog(user);

      expect(dialog.getByText('35 checklist items are not ticked')).toBeInTheDocument();
      await user.click(dialog.getByText('35 checklist items are not ticked'));
      expect(dialog.getByText('Not ticked: Main lift web')).toBeVisible();
    });

    test('an unanswered question blocks signing', async () => {
      const user = userEvent.setup();
      mocked.getSheet.mockResolvedValue(
        job({ sheet: { checkedIds: allIds, bulletinsChecked: true, mardConnected: null } }),
      );
      renderPage();

      const dialog = await openSignDialog(user);
      await user.type(dialog.getByLabelText(/Licence number/), 'AR-1');

      expect(dialog.getByText('Say whether the MARD is connected')).toBeInTheDocument();
      expect(dialog.getByRole('button', { name: 'Sign' })).toBeDisabled();
    });

    test('shows what the API says when signing fails and stays on the page', async () => {
      const user = userEvent.setup();
      mocked.getSheet.mockResolvedValue(complete());
      mocked.signSheet.mockRejectedValue(new Error('The work cannot be dated in the future'));
      renderPage();

      const dialog = await openSignDialog(user);
      await user.type(dialog.getByLabelText(/Licence number/), 'AR-1');
      await user.click(dialog.getByRole('button', { name: 'Sign' }));

      expect(await dialog.findByText('The work cannot be dated in the future')).toBeInTheDocument();
      expect(screen.queryByText('Print page')).not.toBeInTheDocument();
    });
  });

  test('a sheet that is already signed opens its printable page', async () => {
    mocked.getSheet.mockResolvedValue(job({ sheet: { status: 'signed', sheetNo: 3 } }));
    renderPage();

    expect(await screen.findByText('Print page')).toBeInTheDocument();
  });

  test('shows the error when the sheet cannot be loaded', async () => {
    mocked.getSheet.mockRejectedValue(new Error('Packing sheet not found'));
    renderPage();

    expect(await screen.findByText('Packing sheet not found')).toBeInTheDocument();
  });
});
