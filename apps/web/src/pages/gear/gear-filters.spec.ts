import type { GearItemView, GearKind, RigView } from '@bendike/shared';
import { filterRigs, filterSpares, sortRigs } from './gear-filters';

function item(kind: GearKind, overrides: Partial<GearItemView> = {}): GearItemView {
  return {
    id: `${kind}-${Math.random()}`,
    ownerId: 'o',
    rigId: null,
    modelId: null,
    kind,
    manufacturer: 'PD',
    model: 'VR360',
    serial: '1',
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
    ...overrides,
  };
}

function rig(
  name: string,
  status: RigView['status'],
  slots: Partial<Record<GearKind, GearItemView>> = {},
  grounded = false,
): RigView {
  return {
    id: name,
    ownerId: 'o',
    name,
    notes: '',
    active: true,
    slots: { container: null, main: null, reserve: null, aad: null, ...slots },
    status,
    readiness: { state: grounded ? 'grounded' : 'airworthy', reasons: [] },
    lastInspection: null,
    riggers: [],
  };
}

const rigs = [
  rig('Micro 3', 'ok', {
    reserve: item('reserve', { status: 'ok', manufacturer: 'UPT', model: 'VTC-2R', serial: '007284' }),
  }),
  rig('Escuela 11', 'overdue', {
    reserve: item('reserve', { status: 'overdue' }),
    aad: item('aad', { status: 'ok', model: 'Vigil 4' }),
  }),
  rig('Escuela 2', 'due_soon', { aad: item('aad', { status: 'due_soon' }) }),
  rig('Fleet 9', 'ok', {}, true),
];

describe('filterRigs', () => {
  test('with no filters returns everything', () => {
    expect(filterRigs(rigs, {})).toHaveLength(4);
  });

  test('by status uses the rig status', () => {
    expect(filterRigs(rigs, { status: 'overdue' }).map((r) => r.name)).toEqual(['Escuela 11']);
  });

  test('by kind keeps rigs that have that component', () => {
    expect(filterRigs(rigs, { kind: 'aad' }).map((r) => r.name)).toEqual(['Escuela 11', 'Escuela 2']);
  });

  test('kind and status together look at that component status', () => {
    expect(filterRigs(rigs, { kind: 'reserve', status: 'overdue' }).map((r) => r.name)).toEqual(['Escuela 11']);
    expect(filterRigs(rigs, { kind: 'aad', status: 'overdue' })).toEqual([]);
  });

  test('grounded is its own filter', () => {
    expect(filterRigs(rigs, { status: 'grounded' }).map((r) => r.name)).toEqual(['Fleet 9']);
  });

  test('search matches the rig name and any component manufacturer, model or serial, ignoring case', () => {
    expect(filterRigs(rigs, { search: 'micro' }).map((r) => r.name)).toEqual(['Micro 3']);
    expect(filterRigs(rigs, { search: '007284' }).map((r) => r.name)).toEqual(['Micro 3']);
    expect(filterRigs(rigs, { search: 'vigil' }).map((r) => r.name)).toEqual(['Escuela 11']);
  });
});

describe('filterSpares', () => {
  const spares = [item('reserve', { status: 'overdue', serial: 'A1' }), item('aad', { status: 'ok', serial: 'B2' })];

  test('filters by kind, status and search', () => {
    expect(filterSpares(spares, { kind: 'aad' })).toHaveLength(1);
    expect(filterSpares(spares, { status: 'overdue' })).toHaveLength(1);
    expect(filterSpares(spares, { search: 'b2' })).toHaveLength(1);
    expect(filterSpares(spares, { status: 'grounded' })).toEqual([]);
  });
});

describe('sortRigs', () => {
  test('most urgent first: grounded, overdue, due soon, no data, ok, then by name', () => {
    const sorted = sortRigs([...rigs, rig('A none', 'no_data')], 'urgent').map((r) => r.name);

    expect(sorted).toEqual(['Fleet 9', 'Escuela 11', 'Escuela 2', 'A none', 'Micro 3']);
  });

  test('by name is natural, ignoring case', () => {
    expect(sortRigs(rigs, 'name').map((r) => r.name)).toEqual(['Escuela 2', 'Escuela 11', 'Fleet 9', 'Micro 3']);
  });
});
