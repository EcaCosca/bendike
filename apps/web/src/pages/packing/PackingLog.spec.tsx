import { Role, type PackingSheetSummary } from '@bendike/shared';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as api from './packing-api';
import { PackingLog } from './PackingLog';

jest.mock('./packing-api');

const mocked = jest.mocked(api);

function summary(overrides: Partial<PackingSheetSummary> = {}): PackingSheetSummary {
  return {
    id: 'sheet-2',
    rigId: 'tandem-1',
    rigName: 'Tandem 1',
    reserveItemId: 'reserve-1',
    entryId: 'entry-2',
    sheetNo: 2,
    performedOn: '2026-09-10',
    riggerName: 'Eca Rigger',
    missingCount: 0,
    voided: false,
    signedAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

function renderLog(
  role: Role = Role.Dropzone,
  scope: { rigId: string } | { reserveItemId: string } = { rigId: 'tandem-1' },
) {
  render(
    <MemoryRouter>
      <PackingLog token="token-1" role={role} scope={scope} />
    </MemoryRouter>,
  );
}

describe('PackingLog', () => {
  test('lists the signed sheets with number, date, rigger and what was missing, each linking to the printable sheet', async () => {
    mocked.listSheets.mockResolvedValue([
      summary({ id: 'sheet-2', sheetNo: 2, missingCount: 3 }),
      summary({ id: 'sheet-1', sheetNo: 1, performedOn: '2026-03-01' }),
    ]);
    renderLog();

    const table = await screen.findByRole('table', { name: 'Reserve packing log' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('2')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('2026-09-10')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('Eca Rigger')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('3 not complete')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Complete')).toBeInTheDocument();
    expect(within(rows[0]!).getByRole('link', { name: 'Open sheet 2' })).toHaveAttribute(
      'href',
      '/app/gear/tandem-1/packing/sheet-2/print',
    );
    expect(mocked.listSheets).toHaveBeenCalledWith('token-1', { rigId: 'tandem-1' });
  });

  test('a void sheet is marked void', async () => {
    mocked.listSheets.mockResolvedValue([summary({ voided: true })]);
    renderLog();

    expect(await screen.findByText('Void')).toBeInTheDocument();
  });

  test('can list by reserve', async () => {
    mocked.listSheets.mockResolvedValue([summary()]);
    renderLog(Role.Rigger, { reserveItemId: 'reserve-1' });

    await screen.findByRole('table', { name: 'Reserve packing log' });
    expect(mocked.listSheets).toHaveBeenCalledWith('token-1', { reserveItemId: 'reserve-1' });
  });

  test('with no sheets it shows nothing to an owner and a hint to a rigger', async () => {
    mocked.listSheets.mockResolvedValue([]);
    const { unmount } = render(
      <MemoryRouter>
        <PackingLog token="token-1" role={Role.User} scope={{ rigId: 'tandem-1' }} />
      </MemoryRouter>,
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText(/packing sheets/i)).not.toBeInTheDocument();
    unmount();

    renderLog(Role.Rigger);
    expect(await screen.findByText(/No signed packing sheets yet/)).toBeInTheDocument();
  });

  test('shows the error when the log cannot be loaded', async () => {
    mocked.listSheets.mockRejectedValue(new Error('Boom'));
    renderLog(Role.Rigger);

    expect(await screen.findByText('Boom')).toBeInTheDocument();
  });
});
