import { buildGearItemView, buildOverview, buildRigView, toEntryView, type ItemInput } from './gear-views';
import type { ComponentPart } from './entities/component-part.entity';
import { AadDetail, ReserveDetail } from './entities/details.entities';
import type { GearItem } from './entities/gear-item.entity';
import type { GearModel } from './entities/gear-model.entity';
import type { MaintenanceEntry } from './entities/maintenance-entry.entity';
import type { Rig } from './entities/rig.entity';

const TODAY = '2026-09-19';
let counter = 0;

function id(): string {
  counter += 1;
  return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
}

function item(overrides: Partial<GearItem> = {}): GearItem {
  return {
    id: id(),
    ownerId: 'owner-1',
    rigId: null,
    modelId: null,
    kind: 'reserve',
    manufacturer: 'PD',
    model: 'VR360',
    serial: '10586',
    manufacturedOn: '2020-09-01',
    notes: '',
    retiredAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function entry(gearItemId: string, overrides: Partial<MaintenanceEntry> = {}): MaintenanceEntry {
  return {
    id: id(),
    gearItemId,
    kind: 'repack',
    result: null,
    performedOn: '2026-08-27',
    description: 'Repack',
    performedById: 'rigger-1',
    performedByName: 'Eca',
    performedByLicence: null,
    performedByContact: null,
    ownerReported: false,
    verifiedById: null,
    verifiedAt: null,
    voidedById: null,
    voidedAt: null,
    voidReason: null,
    createdAt: new Date('2026-08-27T12:00:00Z'),
    ...overrides,
  };
}

function reserveInput(overrides: Partial<ItemInput> = {}, itemOverrides: Partial<GearItem> = {}): ItemInput {
  const gear = item(itemOverrides);
  const detail = Object.assign(new ReserveDetail(), {
    gearItemId: gear.id,
    sizeSqft: 143,
    repackCycleDays: null,
    deployments: 0,
  });
  return { item: gear, detail, parts: [], model: null, entries: [], ...overrides };
}

function aadInput(itemOverrides: Partial<GearItem> = {}, detailOverrides: Partial<AadDetail> = {}): ItemInput {
  const gear = item({ kind: 'aad', manufacturer: 'AAD', model: 'Vigil 4', ...itemOverrides });
  const detail = Object.assign(new AadDetail(), {
    gearItemId: gear.id,
    mode: null,
    batteryInstalledOn: null,
    batteryCycleMonths: null,
    serviceDueOn: null,
    expiresOn: '2041-10-01',
    ...detailOverrides,
  });
  return { item: gear, detail, parts: [], model: null, entries: [] };
}

describe('buildGearItemView', () => {
  test('a reserve repacked within its cycle is ok with the due date computed from the latest entry', () => {
    const input = reserveInput();
    input.entries = [entry(input.item.id, { performedOn: '2026-08-27' })];

    const view = buildGearItemView(input, TODAY);

    expect(view.kind).toBe('reserve');
    expect(view.dues).toEqual([{ kind: 'repack', dueOn: '2027-02-23', daysLeft: 157, status: 'ok' }]);
    expect(view.status).toBe('ok');
    expect(view.details).toEqual({ sizeSqft: 143, repackCycleDays: null, deployments: 0 });
  });

  test('a reserve with no repack logged is no_data', () => {
    expect(buildGearItemView(reserveInput(), TODAY).status).toBe('no_data');
  });

  test("uses the model's repack cycle when the component has none", () => {
    const model = { repackCycleDays: 120 } as GearModel;
    const input = reserveInput({ model });
    input.entries = [entry(input.item.id, { performedOn: '2026-09-01' })];

    expect(buildGearItemView(input, TODAY).dues[0]?.dueOn).toBe('2026-12-30');
  });

  test('a voided repack is ignored for the due date', () => {
    const input = reserveInput();
    input.entries = [
      entry(input.item.id, { performedOn: '2026-09-10', voidedAt: new Date(), voidReason: 'typo' }),
      entry(input.item.id, { performedOn: '2026-01-10' }),
    ];

    expect(buildGearItemView(input, TODAY).status).toBe('overdue');
  });

  test('an AAD reports its typed dates', () => {
    const view = buildGearItemView(aadInput({}, { serviceDueOn: '2026-12-01' }), TODAY);

    expect(view.dues.map((d) => [d.kind, d.status])).toEqual([
      ['service', 'due_soon'],
      ['expiry', 'ok'],
    ]);
    expect(view.status).toBe('due_soon');
  });

  test('a container has no due dates and reports ok, since nothing about it can be overdue', () => {
    const view = buildGearItemView(
      { item: item({ kind: 'container' }), detail: null, parts: [], model: null, entries: [] },
      TODAY,
    );

    expect(view.dues).toEqual([]);
    expect(view.status).toBe('ok');
    expect(view.details).toEqual({ harnessSize: null, tso: null });
  });

  test('lists parts on the component', () => {
    const input = reserveInput();
    const part = {
      id: id(),
      gearItemId: input.item.id,
      kind: 'bridle',
      description: 'Bridle',
      serial: null,
      manufacturedOn: null,
      notes: '',
    };
    input.parts = [part as ComponentPart];

    expect(buildGearItemView(input, TODAY).parts).toEqual([part]);
  });

  test('an unverified owner-reported repack is pending verification and still counts for the due date', () => {
    const input = reserveInput();
    const pending = entry(input.item.id, {
      performedOn: '2026-09-10',
      ownerReported: true,
      performedByName: 'Outside Rigger',
      performedByContact: '+54 9 11 5555 5555',
    });
    input.entries = [pending];

    const view = buildGearItemView(input, TODAY);

    expect(view.status).toBe('ok');
    expect(view.pendingVerification).toEqual([
      {
        entryId: pending.id,
        gearItemId: input.item.id,
        kind: 'repack',
        performedOn: '2026-09-10',
        performedByName: 'Outside Rigger',
        performedByContact: '+54 9 11 5555 5555',
      },
    ]);
  });

  test('a verified or voided owner-reported repack is not pending', () => {
    const input = reserveInput();
    input.entries = [
      entry(input.item.id, { ownerReported: true, verifiedAt: new Date() }),
      entry(input.item.id, { ownerReported: true, voidedAt: new Date(), voidReason: 'x' }),
    ];

    expect(buildGearItemView(input, TODAY).pendingVerification).toEqual([]);
  });
});

describe('buildRigView', () => {
  const rig = { id: 'rig-1', ownerId: 'owner-1', name: 'Micro 3', notes: '', active: true } as Rig;

  function fourSlots() {
    const container = buildGearItemView(
      { item: item({ kind: 'container', rigId: rig.id }), detail: null, parts: [], model: null, entries: [] },
      TODAY,
    );
    const reserveIn = reserveInput({}, { rigId: rig.id });
    reserveIn.entries = [entry(reserveIn.item.id, { performedOn: '2026-08-27' })];
    const reserve = buildGearItemView(reserveIn, TODAY);
    const aad = buildGearItemView(aadInput({ rigId: rig.id }), TODAY);
    const main = buildGearItemView(
      { item: item({ kind: 'main', rigId: rig.id }), detail: null, parts: [], model: null, entries: [] },
      TODAY,
    );
    return [container, reserve, aad, main];
  }

  test('puts each component in its slot and takes the worst status', () => {
    const view = buildRigView(rig, fourSlots());

    expect(Object.keys(view.slots)).toEqual(['container', 'main', 'reserve', 'aad']);
    expect(view.slots.reserve?.kind).toBe('reserve');
    expect(view.status).toBe('ok');
    expect(view.readiness).toEqual({ state: 'airworthy', reasons: [] });
  });

  test('an empty reserve or AAD slot makes the rig no_data', () => {
    const view = buildRigView(
      rig,
      fourSlots().filter((i) => i.kind !== 'aad'),
    );

    expect(view.slots.aad).toBeNull();
    expect(view.status).toBe('no_data');
  });

  test('a rig is grounded while any component has work awaiting verification', () => {
    const items = fourSlots();
    const reserve = items.find((i) => i.kind === 'reserve');
    if (!reserve) throw new Error('missing reserve');
    reserve.pendingVerification = [
      {
        entryId: 'e1',
        gearItemId: reserve.id,
        kind: 'repack',
        performedOn: '2026-09-10',
        performedByName: 'Outside Rigger',
        performedByContact: null,
      },
    ];

    const view = buildRigView(rig, items);

    expect(view.readiness.state).toBe('grounded');
    expect(view.readiness.reasons).toEqual([{ type: 'pending_verification', entries: reserve.pendingVerification }]);
  });
});

describe('groundings and bulletins on the views', () => {
  const rig = { id: 'rig-1', ownerId: 'owner-1', name: 'Micro 3', notes: '', active: true } as Rig;
  const grounding = {
    id: 'g1',
    rigId: null,
    gearItemId: 'x',
    reason: 'Bulletin SB-1: replace the slider',
    source: 'bulletin',
    bulletinMatchId: 'm1',
    openedByName: 'Admin',
    openedAt: '2026-09-18T10:00:00.000Z',
    closedByName: null,
    closedAt: null,
    closeNote: null,
  } as const;

  test('an item carries the open bulletin notices and groundings it was given', () => {
    const input = reserveInput();
    const notice = {
      matchId: 'm1',
      bulletinId: 'b1',
      reference: 'SB-1',
      title: 'Slider',
      severity: 'mandatory',
      confidence: 'exact',
    } as const;

    const view = buildGearItemView({ ...input, bulletins: [notice], groundings: [grounding] }, TODAY);

    expect(view.bulletins).toEqual([notice]);
    expect(view.groundings).toEqual([grounding]);
  });

  test('an item with none reports empty lists', () => {
    const view = buildGearItemView(reserveInput(), TODAY);

    expect(view.bulletins).toEqual([]);
    expect(view.groundings).toEqual([]);
  });

  test('an open grounding grounds the rig with the grounding as the reason', () => {
    const reserve = buildGearItemView(reserveInput({}, { rigId: rig.id }), TODAY);

    const view = buildRigView(rig, [reserve], [], [], [grounding]);

    expect(view.readiness.state).toBe('grounded');
    expect(view.readiness.reasons).toEqual([{ type: 'grounding', grounding }]);
  });

  test('every reason is reported together, in a stable order', () => {
    const reserve = buildGearItemView(reserveInput({}, { rigId: rig.id }), TODAY);
    reserve.pendingVerification = [
      {
        entryId: 'e1',
        gearItemId: reserve.id,
        kind: 'repack',
        performedOn: '2026-09-10',
        performedByName: 'X',
        performedByContact: null,
      },
    ];
    const inspection = entry(reserve.id, {
      kind: 'inspection',
      result: 'grounded',
      performedOn: '2026-09-01',
      performedByName: 'Eca',
    });

    const view = buildRigView(rig, [reserve], [inspection], [], [grounding]);

    expect(view.readiness.reasons.map((r) => r.type)).toEqual([
      'pending_verification',
      'inspection_grounded',
      'grounding',
    ]);
  });
});

describe('rig inspections', () => {
  const rig = { id: 'rig-1', ownerId: 'owner-1', name: 'Micro 3', notes: '', active: true } as Rig;

  function inspection(
    gearItemId: string,
    performedOn: string,
    result: 'passed' | 'needs_work' | 'grounded',
    extra: Partial<MaintenanceEntry> = {},
  ) {
    return entry(gearItemId, {
      kind: 'inspection',
      result,
      performedOn,
      description: `Inspection ${result}`,
      performedByName: 'Eca Rigger',
      ...extra,
    });
  }

  function view(entries: MaintenanceEntry[]) {
    const reserve = buildGearItemView(reserveInput({}, { rigId: rig.id }), TODAY);
    return buildRigView(rig, [reserve], entries);
  }

  test('a rig with no inspection has no last inspection', () => {
    expect(view([]).lastInspection).toBeNull();
  });

  test('the last inspection is the most recent one that is not void, with its result and rigger', () => {
    const result = view([
      inspection('reserve-1', '2026-06-01', 'passed'),
      inspection('reserve-1', '2026-09-01', 'needs_work'),
      inspection('reserve-1', '2026-09-10', 'passed', { voidedAt: new Date(), voidReason: 'wrong rig' }),
    ]);

    expect(result.lastInspection).toMatchObject({
      performedOn: '2026-09-01',
      result: 'needs_work',
      performedByName: 'Eca Rigger',
    });
    expect(result.readiness.state).toBe('airworthy');
  });

  test('a grounded inspection grounds the rig with the rigger as the reason', () => {
    const result = view([inspection('reserve-1', '2026-09-01', 'grounded')]);

    expect(result.readiness.state).toBe('grounded');
    expect(result.readiness.reasons).toEqual([
      {
        type: 'inspection_grounded',
        inspection: expect.objectContaining({ performedOn: '2026-09-01', result: 'grounded' }),
      },
    ]);
  });

  test('a later passed inspection clears it, a later needs work does not', () => {
    expect(
      view([inspection('reserve-1', '2026-09-01', 'grounded'), inspection('reserve-1', '2026-09-05', 'passed')])
        .readiness.state,
    ).toBe('airworthy');
    expect(
      view([inspection('reserve-1', '2026-09-01', 'grounded'), inspection('reserve-1', '2026-09-05', 'needs_work')])
        .readiness.state,
    ).toBe('grounded');
  });

  test('a voided grounded inspection grounds nothing', () => {
    const result = view([
      inspection('reserve-1', '2026-09-01', 'grounded', { voidedAt: new Date(), voidReason: 'oops' }),
    ]);

    expect(result.readiness.state).toBe('airworthy');
  });

  test('pending verification and a grounded inspection are both reported', () => {
    const reserve = buildGearItemView(reserveInput({}, { rigId: rig.id }), TODAY);
    reserve.pendingVerification = [
      {
        entryId: 'e1',
        gearItemId: reserve.id,
        kind: 'repack',
        performedOn: '2026-09-10',
        performedByName: 'X',
        performedByContact: null,
      },
    ];

    const result = buildRigView(rig, [reserve], [inspection(reserve.id, '2026-09-01', 'grounded')]);

    expect(result.readiness.reasons.map((r) => r.type)).toEqual(['pending_verification', 'inspection_grounded']);
  });
});

describe('buildOverview', () => {
  test('counts statuses over active rigs and spares, and grounded rigs', () => {
    const active = { id: 'r1', ownerId: 'o', name: 'A', notes: '', active: true } as Rig;
    const inactive = { id: 'r2', ownerId: 'o', name: 'B', notes: '', active: false } as Rig;
    const overdueReserve = reserveInput({}, { rigId: active.id });
    overdueReserve.entries = [entry(overdueReserve.item.id, { performedOn: '2025-01-01' })];
    const sparse = reserveInput();

    const overview = buildOverview(
      [
        { rig: active, items: [buildGearItemView(overdueReserve, TODAY)] },
        { rig: inactive, items: [buildGearItemView(reserveInput({}, { rigId: inactive.id }), TODAY)] },
      ],
      [buildGearItemView(sparse, TODAY)],
    );

    expect(overview.rigs.map((r) => r.name)).toEqual(['A', 'B']);
    expect(overview.spares).toHaveLength(1);
    expect(overview.summary).toEqual({ overdue: 1, due_soon: 0, no_data: 1, ok: 0, grounded: 0 });
  });
});

describe('toEntryView', () => {
  test('serialises dates and hides internals', () => {
    const view = toEntryView(
      entry('item-1', {
        verifiedAt: new Date('2026-09-01T10:00:00Z'),
        voidedAt: new Date('2026-09-02T10:00:00Z'),
        voidReason: 'wrong date',
      }),
    );

    expect(view.verifiedAt).toBe('2026-09-01T10:00:00.000Z');
    expect(view.voidedAt).toBe('2026-09-02T10:00:00.000Z');
    expect(view.voidReason).toBe('wrong date');
    expect(view.createdAt).toBe('2026-08-27T12:00:00.000Z');
  });
});
