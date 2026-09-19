import { filterWorkItems, paginate, sortWorkItems, type WorkItem, type WorkItemOwner } from './rigger-workspace';

const owner = (id: string, displayName: string): WorkItemOwner => ({
  id,
  displayName,
  role: 'dropzone',
  phone: null,
  email: `${id}@x.example`,
  locale: 'es',
});

function work(id: string, overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id,
    owner: owner('o1', 'Salta'),
    rig: { id: 'r1', name: 'Micro 3', grounded: false },
    item: { id: 'i1', kind: 'reserve', manufacturer: 'PD', model: 'VR360', serial: '1' },
    dueKind: 'repack',
    dueOn: '2026-12-01',
    daysLeft: 73,
    status: 'ok',
    ...overrides,
  };
}

const items = [
  work('ok-late', { status: 'ok', dueOn: '2027-03-01', daysLeft: 163 }),
  work('soon-b', {
    status: 'due_soon',
    dueOn: '2026-10-05',
    daysLeft: 16,
    rig: { id: 'r2', name: 'Escuela 2', grounded: false },
  }),
  work('overdue', {
    status: 'overdue',
    dueOn: '2026-08-28',
    daysLeft: -22,
    owner: owner('o2', 'Ana'),
    rig: { id: 'r3', name: 'Ana rig', grounded: false },
  }),
  work('nodata', {
    status: 'no_data',
    dueOn: null,
    daysLeft: null,
    item: { id: 'i9', kind: 'aad', manufacturer: 'Vigil', model: 'Vigil 2', serial: '45545' },
    dueKind: 'expiry',
  }),
  work('soon-a', { status: 'due_soon', dueOn: '2026-09-30', daysLeft: 11 }),
  work('grounded-ok', {
    status: 'ok',
    dueOn: '2027-01-01',
    daysLeft: 104,
    rig: { id: 'r4', name: 'Fleet 9', grounded: true },
  }),
];

describe('sortWorkItems', () => {
  test('urgency: grounded rigs first, then overdue, due soon, no data, ok, each by date', () => {
    expect(sortWorkItems(items, 'urgency').map((i) => i.id)).toEqual([
      'grounded-ok',
      'overdue',
      'soon-a',
      'soon-b',
      'nodata',
      'ok-late',
    ]);
  });

  test('due: earliest date first, items with no date last', () => {
    expect(sortWorkItems(items, 'due').map((i) => i.id)).toEqual([
      'overdue',
      'soon-a',
      'soon-b',
      'grounded-ok',
      'ok-late',
      'nodata',
    ]);
  });

  test('owner sorts by owner name then rig name; rig sorts by rig name', () => {
    expect(
      sortWorkItems(items, 'owner')
        .map((i) => i.owner.displayName)
        .slice(0, 2),
    ).toEqual(['Ana', 'Salta']);
    expect(sortWorkItems(items, 'rig')[0]?.rig?.name).toBe('Ana rig');
  });

  test('does not change the input', () => {
    const before = items.map((i) => i.id);
    sortWorkItems(items, 'due');
    expect(items.map((i) => i.id)).toEqual(before);
  });
});

describe('filterWorkItems', () => {
  test('by default keeps only what needs attention, hiding ok items', () => {
    expect(
      filterWorkItems(items, {})
        .map((i) => i.id)
        .sort(),
    ).toEqual(['nodata', 'overdue', 'soon-a', 'soon-b']);
  });

  test('status all shows everything and a status shows just it', () => {
    expect(filterWorkItems(items, { status: 'all' })).toHaveLength(6);
    expect(filterWorkItems(items, { status: 'overdue' }).map((i) => i.id)).toEqual(['overdue']);
  });

  test('grounded keeps items of grounded rigs', () => {
    expect(filterWorkItems(items, { status: 'grounded' }).map((i) => i.id)).toEqual(['grounded-ok']);
  });

  test('by owner, component kind and due kind', () => {
    expect(filterWorkItems(items, { status: 'all', ownerId: 'o2' }).map((i) => i.id)).toEqual(['overdue']);
    expect(filterWorkItems(items, { status: 'all', kind: 'aad' }).map((i) => i.id)).toEqual(['nodata']);
    expect(filterWorkItems(items, { status: 'all', dueKind: 'expiry' }).map((i) => i.id)).toEqual(['nodata']);
  });

  test('withinDays keeps overdue and dated items due inside the window, not undated ones', () => {
    expect(
      filterWorkItems(items, { status: 'all', withinDays: 30 })
        .map((i) => i.id)
        .sort(),
    ).toEqual(['overdue', 'soon-a', 'soon-b']);
  });

  test('search matches rig, owner, serial and model, ignoring case', () => {
    expect(filterWorkItems(items, { status: 'all', search: 'vigil' }).map((i) => i.id)).toEqual(['nodata']);
    expect(filterWorkItems(items, { status: 'all', search: '45545' }).map((i) => i.id)).toEqual(['nodata']);
    expect(filterWorkItems(items, { status: 'all', search: 'ESCUELA' }).map((i) => i.id)).toEqual(['soon-b']);
    expect(filterWorkItems(items, { status: 'all', search: 'ana' }).map((i) => i.id)).toEqual(['overdue']);
  });
});

describe('paginate', () => {
  test('returns the page and the total', () => {
    const many = Array.from({ length: 60 }, (_, i) => i);

    expect(paginate(many, 1, 25)).toEqual({ page: many.slice(0, 25), total: 60 });
    expect(paginate(many, 3, 25).page).toHaveLength(10);
    expect(paginate(many, 9, 25).page).toEqual([]);
  });
});
