import type { DueItem } from '@bendike/shared';
import { gearItem, pending, rigView } from './fixtures';
import { equipmentRows, rigNextDue, rigRows } from './gear-grid';

const overdue: DueItem = { kind: 'repack', dueOn: '2026-08-28', daysLeft: -22, status: 'overdue' };
const soon: DueItem = { kind: 'repack', dueOn: '2026-10-01', daysLeft: 12, status: 'due_soon' };
const fine: DueItem = { kind: 'repack', dueOn: '2027-01-01', daysLeft: 100, status: 'ok' };

const escuela = rigView('Escuela 11', {
  slots: {
    container: gearItem('container', { id: 'c1', manufacturer: 'Rigging Innovations', model: 'Micro', serial: 'C-1' }),
    main: null,
    reserve: gearItem('reserve', {
      id: 'r1',
      manufacturer: 'Aerodyne',
      model: 'Smart 175',
      status: 'overdue',
      dues: [overdue],
    }),
    aad: gearItem('aad', {
      id: 'a1',
      manufacturer: 'Airtec',
      model: 'Cypres 2',
      notes: 'battery swapped',
      status: 'ok',
    }),
  },
});
const micro = rigView('Micro 3', {
  slots: {
    container: null,
    main: null,
    reserve: gearItem('reserve', {
      id: 'r2',
      manufacturer: 'UPT',
      model: 'VTC-2R',
      serial: '007284',
      status: 'due_soon',
      dues: [soon],
    }),
    aad: null,
  },
});
const fleet = rigView('Fleet 9', {
  readiness: { state: 'grounded', reasons: [{ type: 'pending_verification', entries: [pending()] }] },
  slots: {
    container: null,
    main: gearItem('main', { id: 'm1', manufacturer: 'PD', model: 'Sabre 3', status: 'ok', dues: [fine] }),
    reserve: null,
    aad: null,
  },
});
const old = rigView('Old rig', {
  active: false,
  slots: {
    container: null,
    main: null,
    reserve: gearItem('reserve', {
      id: 'r3',
      manufacturer: 'Old',
      model: 'Reserve',
      status: 'overdue',
      dues: [overdue],
    }),
    aad: null,
  },
});
const spare = gearItem('aad', {
  id: 's1',
  manufacturer: 'Vigil',
  model: 'Vigil 2',
  serial: '45545',
  status: 'due_soon',
});
const pendingSpare = gearItem('reserve', {
  id: 's2',
  manufacturer: 'PD',
  model: 'Optimum',
  pendingVerification: [pending()],
});

const overview = { rigs: [escuela, micro, fleet, old], spares: [spare, pendingSpare] };
const ids = (rows: { item: { id: string } }[]) => rows.map((r) => r.item.id);

describe('equipmentRows', () => {
  test('has one row per component of every rig, plus the spares, each knowing its rig', () => {
    const rows = equipmentRows(overview, {}, 'name');

    expect(ids(rows).sort()).toEqual(['a1', 'c1', 'm1', 'r1', 'r2', 'r3', 's1', 's2']);
    expect(rows.find((r) => r.item.id === 'r1')?.rig?.name).toBe('Escuela 11');
    expect(rows.find((r) => r.item.id === 's1')?.rig).toBeNull();
  });

  test('filters by component kind', () => {
    expect(ids(equipmentRows(overview, { kind: 'aad' }, 'name'))).toEqual(['a1', 's1']);
  });

  test.each([
    ['manufacturer', 'aerodyne', ['r1']],
    ['model', 'cypres', ['a1']],
    ['serial', '007284', ['r2']],
    ['notes', 'battery', ['a1']],
  ])('searches by %s', (_field, needle, expected) => {
    expect(ids(equipmentRows(overview, { search: needle }, 'name'))).toEqual(expected);
  });

  test('searching a rig name finds all of that rig components', () => {
    expect(ids(equipmentRows(overview, { search: 'escuela' }, 'name'))).toEqual(['c1', 'r1', 'a1']);
  });

  test('filters by the component own status and leaves out inactive rigs', () => {
    expect(ids(equipmentRows(overview, { status: 'overdue' }, 'name'))).toEqual(['r1']);
  });

  test('the grounded filter keeps components of grounded rigs and unverified spares', () => {
    expect(ids(equipmentRows(overview, { status: 'grounded' }, 'name'))).toEqual(['m1', 's2']);
  });

  test('most urgent first orders by status then due date, and inactive rigs last', () => {
    const rows = equipmentRows(overview, {}, 'urgent');

    expect(ids(rows)).toEqual(['r1', 'r2', 's1', 'm1', 'c1', 'a1', 's2', 'r3']);
  });

  test('by name orders by rig then component kind, with spares last', () => {
    expect(ids(equipmentRows(overview, {}, 'name'))).toEqual(['c1', 'r1', 'a1', 'm1', 'r2', 'r3', 's2', 's1']);
  });
});

describe('rigRows', () => {
  test('lists active rigs before inactive ones and applies the filters', () => {
    expect(rigRows([old, micro, escuela], {}, 'name').map((r) => r.name)).toEqual(['Escuela 11', 'Micro 3', 'Old rig']);
    expect(rigRows([old, micro, escuela], { search: 'vtc' }, 'name').map((r) => r.name)).toEqual(['Micro 3']);
  });
});

describe('rigNextDue', () => {
  test('is the most urgent due across the rig components, with the component it belongs to', () => {
    expect(rigNextDue(escuela)).toEqual({ kind: 'reserve', due: overdue });
  });

  test('is null when nothing has a due date', () => {
    expect(rigNextDue(rigView('Empty'))).toBeNull();
  });
});
