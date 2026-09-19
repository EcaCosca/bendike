import type {
  GearItemView,
  GearKind,
  GroundingView,
  MaintenanceEntryView,
  PendingVerification,
  RigDetailView,
  RigView,
} from '@bendike/shared';

export function gearItem(kind: GearKind, overrides: Partial<GearItemView> = {}): GearItemView {
  return {
    id: `${kind}-1`,
    ownerId: 'owner-1',
    rigId: null,
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
    ...overrides,
  };
}

export function rigView(name: string, overrides: Partial<RigView> = {}): RigView {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    ownerId: 'owner-1',
    name,
    notes: '',
    active: true,
    slots: { container: null, main: null, reserve: null, aad: null },
    status: 'ok',
    readiness: { state: 'airworthy', reasons: [] },
    lastInspection: null,
    riggers: [],
    ...overrides,
  };
}

export function entryView(overrides: Partial<MaintenanceEntryView> = {}): MaintenanceEntryView {
  return {
    id: 'entry-1',
    gearItemId: 'reserve-1',
    kind: 'repack',
    result: null,
    performedOn: '2026-09-10',
    description: 'Repack',
    performedById: 'owner-1',
    performedByName: 'Carlos Packer',
    performedByLicence: null,
    performedByContact: '+54 9 341 555 0000',
    ownerReported: true,
    verifiedAt: null,
    verifiedById: null,
    voidedAt: null,
    voidReason: null,
    createdAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

export function pending(overrides: Partial<PendingVerification> = {}): PendingVerification {
  return {
    entryId: 'entry-1',
    gearItemId: 'reserve-1',
    kind: 'repack',
    performedOn: '2026-09-10',
    performedByName: 'Carlos Packer',
    performedByContact: '+54 9 341 555 0000',
    ...overrides,
  };
}

export function rigDetail(name: string, overrides: Partial<RigDetailView> = {}): RigDetailView {
  return { ...rigView(name), entries: [], groundingHistory: [], ...overrides };
}

export function groundingView(overrides: Partial<GroundingView> = {}): GroundingView {
  return {
    id: 'g1',
    rigId: 'micro-3',
    gearItemId: null,
    reason: 'Frayed cutaway handle',
    source: 'manual',
    bulletinMatchId: null,
    openedByName: 'Eca Rigger',
    openedAt: '2026-09-18T10:00:00.000Z',
    closedByName: null,
    closedAt: null,
    closeNote: null,
    ...overrides,
  };
}
