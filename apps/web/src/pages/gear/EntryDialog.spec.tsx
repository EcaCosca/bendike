import { Role, type GearItemView, type MaintenanceEntryView } from '@bendike/shared';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as api from './gear-api';
import { EntryDialog } from './EntryDialog';

jest.mock('./gear-api');

const mocked = jest.mocked(api);

function gear(kind: GearItemView['kind']): GearItemView {
  return {
    id: 'item-1',
    ownerId: 'o',
    rigId: 'rig-1',
    modelId: null,
    kind,
    manufacturer: 'PD',
    model: 'VR360',
    serial: '10586',
    manufacturedOn: null,
    notes: '',
    retiredAt: null,
    details: {} as GearItemView['details'],
    parts: [],
    dues: [],
    status: 'ok',
    pendingVerification: [],
    bulletins: [],
    groundings: [],
  };
}

const saved = {
  id: 'e1',
  kind: 'repack',
  performedOn: '2026-09-19',
  ownerReported: true,
} as MaintenanceEntryView;

const previous: MaintenanceEntryView[] = [
  {
    ...saved,
    id: 'old',
    performedByName: 'Carlos Packer',
    performedByContact: '+54 9 341 555 0000',
    performedByLicence: 'AR-123',
  },
];

function open(role: Role, kind: GearItemView['kind'] = 'reserve', entries: MaintenanceEntryView[] = []) {
  const onSaved = jest.fn();
  render(
    <EntryDialog
      token="t"
      item={gear(kind)}
      role={role}
      today="2026-09-19"
      previousEntries={entries}
      onClose={jest.fn()}
      onSaved={onSaved}
    />,
  );
  return { onSaved, dialog: within(screen.getByRole('dialog')) };
}

describe('EntryDialog for an owner', () => {
  beforeEach(() => {
    mocked.addEntry.mockResolvedValue(saved);
  });

  test('a repack asks who did it and requires an outside rigger name', async () => {
    const user = userEvent.setup();
    const { dialog } = open(Role.Dropzone);
    await user.type(dialog.getByLabelText(/Description/), 'Repack');

    await user.click(dialog.getByRole('button', { name: 'Save entry' }));

    expect(await dialog.findByText('Say who packed it: their name is required.')).toBeInTheDocument();
    expect(mocked.addEntry).not.toHaveBeenCalled();
  });

  test('sends the outside rigger name, contact and licence with the entry', async () => {
    const user = userEvent.setup();
    const { dialog, onSaved } = open(Role.Dropzone);
    await user.type(dialog.getByLabelText(/Description/), 'Repack');
    await user.type(dialog.getByLabelText(/Name of the rigger/), 'Lucia Rigger');
    await user.type(dialog.getByLabelText(/Phone or email/), '+54 9 11 5555 0000');
    await user.type(dialog.getByLabelText(/Licence number/), 'AR-55');

    await user.click(dialog.getByRole('button', { name: 'Save entry' }));

    await waitFor(() =>
      expect(mocked.addEntry).toHaveBeenCalledWith('t', 'item-1', {
        kind: 'repack',
        performedOn: '2026-09-19',
        description: 'Repack',
        performedByName: 'Lucia Rigger',
        performedByContact: '+54 9 11 5555 0000',
        performedByLicence: 'AR-55',
      }),
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  test('explains that outside work stays unverified and grounds the rig', () => {
    const { dialog } = open(Role.User);

    expect(dialog.getByText(/GROUNDED until a Bendike rigger verifies/)).toBeInTheDocument();
  });

  test('offers the riggers used before and fills their contact', async () => {
    const user = userEvent.setup();
    const { dialog } = open(Role.User, 'reserve', previous);

    await user.click(dialog.getByRole('combobox', { name: /Name of the rigger/ }));
    await user.click(screen.getByRole('option', { name: 'Carlos Packer' }));

    expect(dialog.getByLabelText(/Phone or email/)).toHaveValue('+54 9 341 555 0000');
    expect(dialog.getByLabelText(/Licence number/)).toHaveValue('AR-123');
  });

  test('work that is not a safety item can be recorded as the owner own', async () => {
    const user = userEvent.setup();
    const { dialog } = open(Role.User, 'main');
    await user.click(dialog.getByRole('combobox', { name: /Kind of work/ }));
    await user.click(screen.getByRole('option', { name: 'Reline' }));
    await user.type(dialog.getByLabelText(/Description/), 'New lines');

    await user.click(dialog.getByRole('button', { name: 'Save entry' }));

    await waitFor(() =>
      expect(mocked.addEntry).toHaveBeenCalledWith('t', 'item-1', {
        kind: 'reline',
        performedOn: '2026-09-19',
        description: 'New lines',
      }),
    );
  });

  test('an owner is not offered inspections', async () => {
    const user = userEvent.setup();
    const { dialog } = open(Role.User);

    await user.click(dialog.getByRole('combobox', { name: /Kind of work/ }));

    expect(screen.queryByRole('option', { name: 'Inspection' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Repack' })).toBeInTheDocument();
  });

  test('shows the API error and keeps the dialog open', async () => {
    mocked.addEntry.mockRejectedValue(new Error('The work cannot be dated in the future'));
    const user = userEvent.setup();
    const { dialog, onSaved } = open(Role.Dropzone);
    await user.type(dialog.getByLabelText(/Description/), 'Repack');
    await user.type(dialog.getByLabelText(/Name of the rigger/), 'Lucia');

    await user.click(dialog.getByRole('button', { name: 'Save entry' }));

    expect(await dialog.findByText('The work cannot be dated in the future')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});

describe('EntryDialog for a rigger or an admin', () => {
  beforeEach(() => {
    mocked.addEntry.mockResolvedValue({ ...saved, ownerReported: false });
  });

  test('signs the work as themselves, with no outside rigger section', () => {
    const { dialog } = open(Role.Rigger);

    expect(dialog.queryByLabelText(/Name of the rigger/)).not.toBeInTheDocument();
  });

  test('an inspection needs a result', async () => {
    const user = userEvent.setup();
    const { dialog } = open(Role.Rigger);
    await user.click(dialog.getByRole('combobox', { name: /Kind of work/ }));
    await user.click(screen.getByRole('option', { name: 'Inspection' }));
    await user.type(dialog.getByLabelText(/Description/), 'Looks good');

    await user.click(dialog.getByRole('button', { name: 'Save entry' }));
    expect(await dialog.findByText('Choose the result of the inspection.')).toBeInTheDocument();

    await user.click(dialog.getByRole('combobox', { name: /Result/ }));
    await user.click(screen.getByRole('option', { name: 'Grounded' }));
    await user.click(dialog.getByRole('button', { name: 'Save entry' }));

    await waitFor(() =>
      expect(mocked.addEntry).toHaveBeenCalledWith('t', 'item-1', {
        kind: 'inspection',
        performedOn: '2026-09-19',
        description: 'Looks good',
        result: 'grounded',
      }),
    );
  });

  test('an AAD service can carry the next service date', async () => {
    const user = userEvent.setup();
    const { dialog } = open(Role.Rigger, 'aad');
    await user.click(dialog.getByRole('combobox', { name: /Kind of work/ }));
    await user.click(screen.getByRole('option', { name: 'AAD service' }));
    await user.type(dialog.getByLabelText(/Description/), 'Manufacturer service');
    await user.type(dialog.getByLabelText(/Next service due/), '2031-09-19');

    await user.click(dialog.getByRole('button', { name: 'Save entry' }));

    await waitFor(() =>
      expect(mocked.addEntry).toHaveBeenCalledWith(
        't',
        'item-1',
        expect.objectContaining({ kind: 'aad_service', nextServiceDueOn: '2031-09-19' }),
      ),
    );
  });
});
