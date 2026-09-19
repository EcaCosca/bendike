import {
  addDays,
  addMonths,
  addYears,
  computeDueItems,
  daysUntil,
  dueStatus,
  needsVerification,
  todayIn,
  worstStatus,
  type DueEntryInput,
} from './due-dates';

const TODAY = '2026-09-19';

function entry(kind: DueEntryInput['kind'], performedOn: string, voided = false): DueEntryInput {
  return { kind, performedOn, voided };
}

describe('todayIn', () => {
  test('uses the Buenos Aires calendar day, not the UTC one', () => {
    expect(todayIn(new Date('2026-09-20T01:30:00Z'))).toBe('2026-09-19');
    expect(todayIn(new Date('2026-09-19T03:00:00Z'))).toBe('2026-09-19');
    expect(todayIn(new Date('2026-09-19T02:59:00Z'))).toBe('2026-09-18');
  });
});

describe('date arithmetic', () => {
  test('addDays crosses months and years', () => {
    expect(addDays('2026-09-19', 180)).toBe('2027-03-18');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('addMonths clamps to the last day of a shorter month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15');
  });

  test('addYears is twelve months per year', () => {
    expect(addYears('2021-10-01', 10)).toBe('2031-10-01');
  });

  test('daysUntil is signed', () => {
    expect(daysUntil('2026-09-20', TODAY)).toBe(1);
    expect(daysUntil(TODAY, TODAY)).toBe(0);
    expect(daysUntil('2026-09-18', TODAY)).toBe(-1);
  });
});

describe('dueStatus', () => {
  test.each([
    ['2026-09-18', 21, 'overdue'],
    ['2026-09-19', 21, 'due_soon'],
    ['2026-10-10', 21, 'due_soon'],
    ['2026-10-11', 21, 'ok'],
    ['2026-12-18', 90, 'due_soon'],
    ['2026-12-19', 90, 'ok'],
  ])('%s with a %d day window is %s', (dueOn, window, expected) => {
    expect(dueStatus(dueOn, window, TODAY)).toBe(expected);
  });

  test('a missing date is no_data', () => {
    expect(dueStatus(null, 21, TODAY)).toBe('no_data');
  });
});

describe('worstStatus', () => {
  test('orders overdue, due soon, no data, ok', () => {
    expect(worstStatus(['ok', 'due_soon', 'overdue', 'no_data'])).toBe('overdue');
    expect(worstStatus(['ok', 'no_data', 'due_soon'])).toBe('due_soon');
    expect(worstStatus(['ok', 'no_data'])).toBe('no_data');
    expect(worstStatus(['ok', 'ok'])).toBe('ok');
  });

  test('nothing to judge is no_data', () => {
    expect(worstStatus([])).toBe('no_data');
  });
});

describe('computeDueItems for a reserve', () => {
  const base = {
    kind: 'reserve' as const,
    manufacturedOn: '2018-02-01',
    details: { repackCycleDays: null },
    model: null,
    today: TODAY,
  };

  test('no repack logged is no_data with no date', () => {
    expect(computeDueItems({ ...base, entries: [] })).toEqual([
      { kind: 'repack', dueOn: null, daysLeft: null, status: 'no_data' },
    ]);
  });

  test('uses the latest repack plus the default 180 days', () => {
    const items = computeDueItems({ ...base, entries: [entry('repack', '2026-05-15'), entry('repack', '2025-11-01')] });

    expect(items).toEqual([{ kind: 'repack', dueOn: '2026-11-11', daysLeft: 53, status: 'ok' }]);
  });

  test('is due soon inside 21 days and overdue after the date', () => {
    expect(computeDueItems({ ...base, entries: [entry('repack', '2026-04-05')] })[0]).toMatchObject({
      dueOn: '2026-10-02',
      status: 'due_soon',
    });
    expect(computeDueItems({ ...base, entries: [entry('repack', '2026-03-01')] })[0]).toMatchObject({
      dueOn: '2026-08-28',
      status: 'overdue',
      daysLeft: -22,
    });
  });

  test('ignores a voided repack', () => {
    const items = computeDueItems({
      ...base,
      entries: [entry('repack', '2026-09-01', true), entry('repack', '2026-01-10')],
    });

    expect(items[0]).toMatchObject({ dueOn: '2026-07-09', status: 'overdue' });
  });

  test('the component cycle beats the model cycle, which beats the default', () => {
    const entries = [entry('repack', '2026-09-01')];

    expect(computeDueItems({ ...base, entries, details: { repackCycleDays: 90 } })[0]?.dueOn).toBe('2026-11-30');
    expect(computeDueItems({ ...base, entries, model: { repackCycleDays: 120 } })[0]?.dueOn).toBe('2026-12-30');
    expect(
      computeDueItems({ ...base, entries, details: { repackCycleDays: 90 }, model: { repackCycleDays: 120 } })[0]
        ?.dueOn,
    ).toBe('2026-11-30');
  });
});

describe('computeDueItems for an AAD', () => {
  const base = {
    kind: 'aad' as const,
    manufacturedOn: '2021-10-01',
    details: { batteryInstalledOn: null, batteryCycleMonths: null, serviceDueOn: null, expiresOn: null },
    model: null,
    today: TODAY,
  };

  test('with nothing to compute from it is a single no_data item', () => {
    expect(computeDueItems({ ...base, entries: [] })).toEqual([
      { kind: 'expiry', dueOn: null, daysLeft: null, status: 'no_data' },
    ]);
  });

  test('typed service and expiry dates become items with a 90 day window', () => {
    const items = computeDueItems({
      ...base,
      entries: [],
      details: { ...base.details, serviceDueOn: '2026-12-01', expiresOn: '2041-10-01' },
    });

    expect(items).toEqual([
      { kind: 'service', dueOn: '2026-12-01', daysLeft: 73, status: 'due_soon' },
      { kind: 'expiry', dueOn: '2041-10-01', daysLeft: 5491, status: 'ok' },
    ]);
  });

  test('a battery cycle counts from the latest battery entry, then from the installed date', () => {
    const details = { ...base.details, batteryCycleMonths: 24, batteryInstalledOn: '2024-06-01' };

    expect(computeDueItems({ ...base, entries: [entry('battery', '2025-01-15')], details })[0]).toMatchObject({
      kind: 'battery',
      dueOn: '2027-01-15',
    });
    expect(computeDueItems({ ...base, entries: [], details })[0]).toMatchObject({
      kind: 'battery',
      dueOn: '2026-06-01',
      status: 'overdue',
    });
  });

  test('a battery cycle with no date to start from is no_data', () => {
    const items = computeDueItems({ ...base, entries: [], details: { ...base.details, batteryCycleMonths: 24 } });

    expect(items[0]).toEqual({ kind: 'battery', dueOn: null, daysLeft: null, status: 'no_data' });
  });

  test('no battery item exists when no battery cycle is known', () => {
    const items = computeDueItems({ ...base, entries: [], details: { ...base.details, expiresOn: '2041-10-01' } });

    expect(items.map((i) => i.kind)).toEqual(['expiry']);
  });

  test('a model service interval counts from the latest service, else from manufacture', () => {
    const model = { serviceIntervalMonths: 48 };

    expect(computeDueItems({ ...base, entries: [entry('aad_service', '2025-04-01')], model })[0]).toMatchObject({
      kind: 'service',
      dueOn: '2029-04-01',
    });
    expect(computeDueItems({ ...base, entries: [], model })[0]).toMatchObject({
      kind: 'service',
      dueOn: '2025-10-01',
      status: 'overdue',
    });
  });

  test('expiry falls back to the model life counted from manufacture', () => {
    const items = computeDueItems({ ...base, entries: [], model: { lifeYears: 20 } });

    expect(items[0]).toMatchObject({ kind: 'expiry', dueOn: '2041-10-01' });
  });

  test('a typed expiry beats the model life', () => {
    const items = computeDueItems({
      ...base,
      entries: [],
      details: { ...base.details, expiresOn: '2040-08-01' },
      model: { lifeYears: 20 },
    });

    expect(items[0]?.dueOn).toBe('2040-08-01');
  });
});

describe('computeDueItems for a container or a main', () => {
  test.each(['container', 'main'] as const)('%s has no due dates', (kind) => {
    expect(
      computeDueItems({ kind, entries: [], manufacturedOn: null, details: {}, model: null, today: TODAY }),
    ).toEqual([]);
  });
});

describe('needsVerification', () => {
  const owner = { ownerReported: true, verifiedAt: null, voided: false };

  test.each(['repack', 'aad_service', 'repair'] as const)('an unverified owner-reported %s does', (kind) => {
    expect(needsVerification({ ...owner, kind })).toBe(true);
  });

  test.each(['reline', 'kill_line', 'battery', 'inspection', 'assembly', 'other'] as const)('%s never does', (kind) => {
    expect(needsVerification({ ...owner, kind })).toBe(false);
  });

  test('a verified, voided or rigger-written entry does not', () => {
    expect(needsVerification({ ...owner, kind: 'repack', verifiedAt: '2026-09-19T10:00:00Z' })).toBe(false);
    expect(needsVerification({ ...owner, kind: 'repack', voided: true })).toBe(false);
    expect(needsVerification({ ...owner, kind: 'repack', ownerReported: false })).toBe(false);
  });
});
