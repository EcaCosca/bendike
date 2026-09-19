import type { GearOverview } from '@bendike/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { gearItem, pending, rigView } from './fixtures';
import type { GearFilters, RigSort } from './gear-filters';
import { GearGrid } from './GearGrid';

type Data = Pick<GearOverview, 'rigs' | 'spares'>;

function data(): Data {
  return {
    rigs: [
      rigView('Escuela 11', {
        readiness: { state: 'grounded', reasons: [{ type: 'pending_verification', entries: [pending()] }] },
        lastInspection: {
          entryId: 'i',
          gearItemId: 'r1',
          performedOn: '2026-09-15',
          result: 'passed',
          performedByName: 'Eca',
          description: '',
        },
        slots: {
          container: null,
          main: null,
          reserve: gearItem('reserve', {
            id: 'r1',
            rigId: 'escuela-11',
            manufacturer: 'Aerodyne',
            model: 'Smart 175',
            serial: '12934',
            manufacturedOn: '2019-05-02',
            notes: 'Repacked twice',
            status: 'overdue',
            dues: [{ kind: 'repack', dueOn: '2026-08-28', daysLeft: -22, status: 'overdue' }],
          }),
          aad: null,
        },
      }),
      rigView('Old rig', {
        active: false,
        slots: {
          container: null,
          main: gearItem('main', { id: 'm9', rigId: 'old-rig', manufacturer: 'PD', model: 'Sabre 2', status: 'ok' }),
          reserve: null,
          aad: null,
        },
      }),
    ],
    spares: [
      gearItem('aad', {
        id: 's1',
        manufacturer: 'Vigil',
        model: 'Vigil 2',
        serial: '45545',
        status: 'due_soon',
        dues: [{ kind: 'battery', dueOn: '2026-10-01', daysLeft: 12, status: 'due_soon' }],
      }),
    ],
  };
}

function manyItems(count: number): Data {
  return {
    rigs: [],
    spares: Array.from({ length: count }, (_, i) =>
      gearItem('main', {
        id: `m${i}`,
        manufacturer: 'PD',
        model: `Model ${String(i).padStart(2, '0')}`,
        serial: `S${i}`,
      }),
    ),
  };
}

function renderGrid(overview: Data, filters: GearFilters = {}, sort: RigSort = 'name') {
  const view = (f: GearFilters) => (
    <MemoryRouter>
      <GearGrid overview={overview} filters={f} sort={sort} />
    </MemoryRouter>
  );
  const utils = render(view(filters));
  return { ...utils, rerenderWith: (f: GearFilters) => utils.rerender(view(f)) };
}

const bodyRows = (table: HTMLElement) => within(table).getAllByRole('row').slice(1);

describe('GearGrid', () => {
  test('shows one row per component with manufacturer, model, serial, date of manufacture, status, next due and notes', () => {
    renderGrid(data());

    const table = screen.getByRole('table', { name: 'Equipment' });
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((h) => h.textContent);
    expect(headers).toEqual([
      'Rig',
      'Component',
      'Manufacturer',
      'Model',
      'Serial',
      'Manufactured',
      'Status',
      'Next due',
      'Notes',
    ]);
    const reserve = bodyRows(table).find((row) => within(row).queryByText('Smart 175')) as HTMLElement;
    expect(within(reserve).getByRole('link', { name: 'Escuela 11' })).toHaveAttribute('href', '/app/gear/escuela-11');
    expect(within(reserve).getByText('Reserve')).toBeInTheDocument();
    expect(within(reserve).getByText('Aerodyne')).toBeInTheDocument();
    expect(within(reserve).getByRole('link', { name: 'Smart 175' })).toHaveAttribute('href', '/app/gear/items/r1');
    expect(within(reserve).getByText('12934')).toBeInTheDocument();
    expect(within(reserve).getByText('2019-05-02')).toBeInTheDocument();
    expect(within(reserve).getByText('Overdue')).toBeInTheDocument();
    expect(within(reserve).getByText('GROUNDED')).toBeInTheDocument();
    expect(within(reserve).getByText(/Repack 2026-08-28 · 22 days overdue/)).toBeInTheDocument();
    expect(within(reserve).getByText('Repacked twice')).toBeInTheDocument();
  });

  test('spare gear has no rig, and components of an inactive rig say inactive instead of a status', () => {
    renderGrid(data());

    const table = screen.getByRole('table', { name: 'Equipment' });
    const spare = bodyRows(table).find((row) => within(row).queryByText('Vigil 2')) as HTMLElement;
    expect(within(spare).getByText('Spare')).toBeInTheDocument();
    expect(within(spare).getByText('Due soon')).toBeInTheDocument();
    const inactive = bodyRows(table).find((row) => within(row).queryByText('Sabre 2')) as HTMLElement;
    expect(within(inactive).getByText('Inactive')).toBeInTheDocument();
    expect(within(inactive).queryByText('OK')).not.toBeInTheDocument();
  });

  test('applies the page filters', () => {
    renderGrid(data(), { search: 'aerodyne' });

    const rows = bodyRows(screen.getByRole('table', { name: 'Equipment' }));
    expect(rows).toHaveLength(1);
    expect(within(rows[0]!).getByText('Smart 175')).toBeInTheDocument();
  });

  test('says so when nothing matches', () => {
    renderGrid(data(), { search: 'nothing like this' });

    expect(screen.getByText('No equipment matches these filters')).toBeInTheDocument();
  });

  describe('pagination', () => {
    test('shows 25 rows a page and moves between pages', async () => {
      const user = userEvent.setup();
      renderGrid(manyItems(30), {});

      const table = screen.getByRole('table', { name: 'Equipment' });
      expect(bodyRows(table)).toHaveLength(25);
      expect(screen.getByText('1–25 of 30')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Go to next page' }));

      expect(bodyRows(table)).toHaveLength(5);
      expect(screen.getByText('26–30 of 30')).toBeInTheDocument();
      expect(within(bodyRows(table)[0]!).getByText('Model 25')).toBeInTheDocument();
    });

    test('lets the visitor choose how many rows a page shows', async () => {
      const user = userEvent.setup();
      renderGrid(manyItems(30), {});

      await user.click(screen.getByRole('combobox', { name: /rows per page/i }));
      await user.click(screen.getByRole('option', { name: '10' }));

      expect(bodyRows(screen.getByRole('table', { name: 'Equipment' }))).toHaveLength(10);
      expect(screen.getByText('1–10 of 30')).toBeInTheDocument();
    });

    test('goes back to the first page when the filters change', async () => {
      const user = userEvent.setup();
      const { rerenderWith } = renderGrid(manyItems(30), {});
      await user.click(screen.getByRole('button', { name: 'Go to next page' }));

      rerenderWith({ search: 'model' });

      expect(screen.getByText('1–25 of 30')).toBeInTheDocument();
    });

    test('has no pager clutter beyond one page but still shows the count', () => {
      renderGrid(manyItems(3), {});

      expect(screen.getByText('1–3 of 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
    });
  });

  describe('rigs table', () => {
    test('lists each rig with its four components, status, next due, last inspection and notes', async () => {
      const user = userEvent.setup();
      renderGrid(data());

      await user.click(screen.getByRole('button', { name: 'Rigs' }));

      const table = screen.getByRole('table', { name: 'Rigs' });
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((h) => h.textContent),
      ).toEqual(['Rig', 'Status', 'Container', 'Main', 'Reserve', 'AAD', 'Next due', 'Last inspection', 'Notes']);
      const [escuela, old] = bodyRows(table) as [HTMLElement, HTMLElement];
      expect(within(escuela).getByRole('link', { name: 'Escuela 11' })).toHaveAttribute('href', '/app/gear/escuela-11');
      expect(within(escuela).getByText('GROUNDED')).toBeInTheDocument();
      expect(within(escuela).getByText('Aerodyne Smart 175 #12934')).toBeInTheDocument();
      expect(within(escuela).getAllByText('Empty')).toHaveLength(3);
      expect(within(escuela).getByText(/Reserve: Repack 2026-08-28 · 22 days overdue/)).toBeInTheDocument();
      expect(within(escuela).getByText(/Inspected 2026-09-15: Passed by Eca/)).toBeInTheDocument();
      expect(within(old).getByText('Inactive')).toBeInTheDocument();
    });

    test('is paginated too', async () => {
      const user = userEvent.setup();
      const rigs = Array.from({ length: 12 }, (_, i) => rigView(`Rig ${String(i).padStart(2, '0')}`));
      renderGrid({ rigs, spares: [] }, {});
      await user.click(screen.getByRole('button', { name: 'Rigs' }));

      await user.click(screen.getByRole('combobox', { name: /rows per page/i }));
      await user.click(screen.getByRole('option', { name: '10' }));

      expect(bodyRows(screen.getByRole('table', { name: 'Rigs' }))).toHaveLength(10);
      expect(screen.getByText('1–10 of 12')).toBeInTheDocument();
    });
  });
});
