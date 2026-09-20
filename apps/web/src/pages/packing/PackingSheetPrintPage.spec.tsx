import { PACKING_CHECKLIST, Role, type PackingJobView, type PackingSheetView } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import * as api from './packing-api';
import { PackingSheetPrintPage } from './PackingSheetPrintPage';

jest.mock('../../auth/use-auth');
jest.mock('./packing-api');

const mocked = jest.mocked(api);
const allIds = PACKING_CHECKLIST.map((item) => item.id);

function signed(overrides: Partial<PackingSheetView> = {}): PackingSheetView {
  return {
    id: 'sheet-1',
    rigId: 'tandem-1',
    rigName: 'Tandem 1',
    reserveItemId: 'reserve-1',
    ownerId: 'owner-1',
    riggerId: 'rigger-1',
    riggerName: 'Eca Rigger',
    riggerLicence: 'AR-1234',
    status: 'signed',
    voided: false,
    voidReason: null,
    sheetNo: 7,
    performedOn: '2026-09-19',
    checklistVersion: 'ciac-anac-1',
    checkedIds: allIds.filter((id) => id !== 'mard_hooked'),
    bulletinsChecked: true,
    mardConnected: false,
    ownerName: 'Ana Skydiver',
    ownerAddress: 'Calle 1, Rosario',
    ownerPhone: '+5493415550000',
    ownerEmail: 'ana@bendike.example',
    manualDocumentId: 'doc-1',
    manualLabel: 'Sigma II Tandem owners manual (Rev4)',
    notes: 'No MARD on this unit',
    elements: {
      reserve: {
        kind: 'reserve',
        manufacturer: 'UPT Vector',
        model: 'Sigma Reserve',
        serial: 'R-100',
        manufacturedOn: '2021-05-01',
      },
      container: {
        kind: 'container',
        manufacturer: 'UPT Vector',
        model: 'Sigma Tandem',
        serial: 'C-200',
        manufacturedOn: null,
      },
      aad: null,
    },
    missing: [{ code: 'item_unticked', itemId: 'mard_hooked' }, { code: 'mard_not_connected' }, { code: 'no_aad' }],
    signedAt: '2026-09-19T15:00:00.000Z',
    entryId: 'entry-1',
    ownerNotifiedAt: null,
    ownerNotifiedTo: null,
    createdAt: '2026-09-19T10:00:00.000Z',
    updatedAt: '2026-09-19T15:00:00.000Z',
    ...overrides,
  };
}

function asJob(sheet: PackingSheetView): PackingJobView {
  return { sheet, components: { reserve: null, container: null, aad: null } };
}

function renderPage(userId = 'rigger-1', role: Role = Role.Rigger, state?: unknown) {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: userId,
      email: 'x@b.c',
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
    <MemoryRouter initialEntries={[{ pathname: '/app/gear/tandem-1/packing/sheet-1/print', state }]}>
      <Routes>
        <Route path="/app/gear/:rigId/packing/:sheetId/print" element={<PackingSheetPrintPage />} />
        <Route path="/app/gear/:rigId/packing/:sheetId" element={<p>Job page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PackingSheetPrintPage', () => {
  beforeEach(() => {
    mocked.getSheet.mockResolvedValue(asJob(signed()));
  });

  test('lays out the form: number, owner, element table and the two answers', async () => {
    renderPage();

    expect(await screen.findByText('PLANILLA PLEGADOS CIAC / ANAC')).toBeInTheDocument();
    expect(screen.getByText('HOJA #: 7')).toBeInTheDocument();
    expect(screen.getByText('Ana Skydiver')).toBeInTheDocument();
    expect(screen.getByText('Calle 1, Rosario')).toBeInTheDocument();
    expect(screen.getByText('+5493415550000')).toBeInTheDocument();
    expect(screen.getByText('ana@bendike.example')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Elementos' });
    const reserve = within(table).getByText('RESERVA').closest('tr') as HTMLElement;
    expect(within(reserve).getByText('UPT Vector Sigma Reserve')).toBeInTheDocument();
    expect(within(reserve).getByText('R-100')).toBeInTheDocument();
    expect(within(reserve).getByText('2021-05-01')).toBeInTheDocument();
    const aad = within(table).getByText('AAD').closest('tr') as HTMLElement;
    expect(within(aad).getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getByText('BOLETÍN SERVICIO CHEQUEADOS: SÍ ☒ / NO ☐')).toBeInTheDocument();
    expect(screen.getByText('M.A.R.D conectado: SÍ ☐ / NO ☒')).toBeInTheDocument();
  });

  test('shows every checklist item, ticked or empty', async () => {
    renderPage();

    const checklist = await screen.findByRole('table', { name: 'Checklist' });
    expect(within(checklist).getAllByRole('img', { name: 'Ticked' })).toHaveLength(35);
    expect(within(checklist).getAllByRole('img', { name: 'Not ticked' })).toHaveLength(1);
    const mard = within(checklist).getByText('MARD hooked up').closest('td') as HTMLElement;
    expect(within(mard).getByRole('img', { name: 'Not ticked' })).toBeInTheDocument();
    expect(within(checklist).getByText('MARD enganchado')).toBeInTheDocument();
  });

  test('shows the notes, what was missing, the manual, the rigger and the signature line', async () => {
    renderPage();

    expect(await screen.findByText('No MARD on this unit')).toBeInTheDocument();
    expect(screen.getByText('Not ticked: MARD hooked up')).toBeInTheDocument();
    expect(screen.getByText('MARD not connected')).toBeInTheDocument();
    expect(screen.getByText('No AAD on the rig')).toBeInTheDocument();
    expect(screen.getByText('Sigma II Tandem owners manual (Rev4)')).toBeInTheDocument();
    expect(screen.getByText('2026-09-19')).toBeInTheDocument();
    expect(screen.getByText('Eca Rigger')).toBeInTheDocument();
    expect(screen.getByText('AR-1234')).toBeInTheDocument();
    expect(screen.getByText('Firma')).toBeInTheDocument();
  });

  test('a void sheet is marked VOID with its reason', async () => {
    mocked.getSheet.mockResolvedValue(asJob(signed({ voided: true, voidReason: 'Wrong reserve' })));
    renderPage();

    expect(await screen.findByText('VOID')).toBeInTheDocument();
    expect(screen.getByText(/Wrong reserve/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Void sheet' })).not.toBeInTheDocument();
  });

  test('the Print button prints the page', async () => {
    const user = userEvent.setup();
    const print = jest.spyOn(window, 'print').mockImplementation(() => undefined);
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Print' }));

    expect(print).toHaveBeenCalled();
    print.mockRestore();
  });

  test('a draft opens the job page instead', async () => {
    mocked.getSheet.mockResolvedValue(asJob(signed({ status: 'draft', sheetNo: null })));
    renderPage();

    expect(await screen.findByText('Job page')).toBeInTheDocument();
  });

  test('shows the error when the sheet cannot be loaded', async () => {
    mocked.getSheet.mockRejectedValue(new Error('Packing sheet not found'));
    renderPage();

    expect(await screen.findByText('Packing sheet not found')).toBeInTheDocument();
  });

  describe('voiding', () => {
    test('the rigger who signed can void it with a reason', async () => {
      const user = userEvent.setup();
      mocked.voidSheet.mockResolvedValue(signed({ voided: true, voidReason: 'Wrong reserve' }));
      renderPage('rigger-1', Role.Rigger);

      await user.click(await screen.findByRole('button', { name: 'Void sheet' }));
      const dialog = within(screen.getByRole('dialog'));
      expect(dialog.getByRole('button', { name: 'Void' })).toBeDisabled();
      await user.type(dialog.getByLabelText(/Reason/), 'Wrong reserve');
      mocked.getSheet.mockResolvedValue(asJob(signed({ voided: true, voidReason: 'Wrong reserve' })));
      await user.click(dialog.getByRole('button', { name: 'Void' }));

      await waitFor(() => expect(mocked.voidSheet).toHaveBeenCalledWith('token-1', 'sheet-1', 'Wrong reserve'));
      expect(await screen.findByText('VOID')).toBeInTheDocument();
    });

    test('an admin can void any sheet; another rigger and the owner cannot', async () => {
      renderPage('admin-1', Role.Admin);
      expect(await screen.findByRole('button', { name: 'Void sheet' })).toBeInTheDocument();
    });

    test.each([
      ['another rigger', 'rigger-2', Role.Rigger],
      ['the owner', 'owner-1', Role.User],
    ] as const)('%s cannot void it', async (_name, id, role) => {
      renderPage(id, role);
      await screen.findByText('HOJA #: 7');

      expect(screen.queryByRole('button', { name: 'Void sheet' })).not.toBeInTheDocument();
    });
  });

  describe('emailing the owner', () => {
    test('the rigger who signed can email the owner, and sees when and to whom it went', async () => {
      const user = userEvent.setup();
      mocked.notifyOwner.mockResolvedValue(
        signed({ ownerNotifiedAt: '2026-09-20T12:05:00.000Z', ownerNotifiedTo: 'ana@bendike.example' }),
      );
      renderPage();

      await user.click(await screen.findByRole('button', { name: 'Email owner' }));

      await waitFor(() => expect(mocked.notifyOwner).toHaveBeenCalledWith('token-1', 'sheet-1'));
      expect(await screen.findByText('Emailed to ana@bendike.example on 2026-09-20 12:05 UTC')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Email owner again' })).toBeInTheDocument();
    });

    test('shows the last send when the page opens', async () => {
      mocked.getSheet.mockResolvedValue(
        asJob(signed({ ownerNotifiedAt: '2026-09-20T12:05:00.000Z', ownerNotifiedTo: 'ana@bendike.example' })),
      );
      renderPage();

      expect(await screen.findByText('Emailed to ana@bendike.example on 2026-09-20 12:05 UTC')).toBeInTheDocument();
    });

    test('shows why the email could not be sent', async () => {
      const user = userEvent.setup();
      mocked.notifyOwner.mockRejectedValue(
        new Error('The owner was emailed a moment ago. Try again in a few minutes.'),
      );
      renderPage();

      await user.click(await screen.findByRole('button', { name: 'Email owner' }));

      expect(
        await screen.findByText(/Could not email the owner. The owner was emailed a moment ago/),
      ).toBeInTheDocument();
    });

    test('the button is off when the sheet has no owner email', async () => {
      mocked.getSheet.mockResolvedValue(asJob(signed({ ownerEmail: '' })));
      renderPage();

      expect(await screen.findByRole('button', { name: 'Email owner' })).toBeDisabled();
      expect(screen.getByText('Add the owner email before the sheet is signed to email them.')).toBeInTheDocument();
    });

    test('an admin can send it; another rigger, the owner and a void sheet get no button', async () => {
      renderPage('admin-1', Role.Admin);
      expect(await screen.findByRole('button', { name: 'Email owner' })).toBeInTheDocument();
    });

    test.each([
      ['another rigger', 'rigger-2', Role.Rigger],
      ['the owner', 'owner-1', Role.User],
    ] as const)('%s cannot email the owner', async (_name, id, role) => {
      renderPage(id, role);
      await screen.findByText('HOJA #: 7');

      expect(screen.queryByRole('button', { name: /Email owner/ })).not.toBeInTheDocument();
    });

    test('a void sheet cannot be emailed', async () => {
      mocked.getSheet.mockResolvedValue(asJob(signed({ voided: true, voidReason: 'Wrong reserve' })));
      renderPage();
      await screen.findByText('VOID');

      expect(screen.queryByRole('button', { name: /Email owner/ })).not.toBeInTheDocument();
    });

    test('says what happened to the email that was requested while signing', async () => {
      renderPage('rigger-1', Role.Rigger, { notice: { kind: 'sent', to: 'ana@bendike.example' } });
      expect(await screen.findByText('The owner was emailed at ana@bendike.example.')).toBeInTheDocument();
    });

    test('a failed email at signing is reported, with the way to try again', async () => {
      renderPage('rigger-1', Role.Rigger, {
        notice: { kind: 'error', message: 'The email could not be sent', whileSigning: true },
      });

      expect(
        await screen.findByText(
          /The sheet is signed, but the owner could not be emailed. The email could not be sent. You can try again/,
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Email owner' })).toBeInTheDocument();
    });
  });
  describe('read by an authority', () => {
    test('shows the sheet as signed with no email or void action and goes back to the rigger log', async () => {
      renderPage('authority-1', Role.Authority);

      expect(await screen.findByText('HOJA #: 7')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Email owner/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Void sheet' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: "Back to the rigger's log" })).toHaveAttribute(
        'href',
        '/app/authority/riggers/rigger-1',
      );
      expect(screen.queryByRole('link', { name: 'Back to the rig' })).not.toBeInTheDocument();
    });

    test('still links other roles back to the rig', async () => {
      renderPage();

      expect(await screen.findByRole('link', { name: 'Back to the rig' })).toHaveAttribute(
        'href',
        '/app/gear/tandem-1',
      );
    });
  });
});
