import {
  GEAR_KINDS,
  computeDueItems,
  needsVerification,
  worstStatus,
  type ComponentPartView,
  type DueStatus,
  type GearDetails,
  type GearItemView,
  type GearKind,
  type GearOverview,
  type GroundingView,
  type InspectionSummary,
  type MaintenanceEntryView,
  type OpenBulletinNotice,
  type PendingVerification,
  type ReadinessReason,
  type RiggerName,
  type RigView,
} from '@bendike/shared';
import type { ComponentPart } from './entities/component-part.entity';
import { AadDetail, ContainerDetail, MainDetail, ReserveDetail } from './entities/details.entities';
import type { GearItem } from './entities/gear-item.entity';
import type { GearModel } from './entities/gear-model.entity';
import type { MaintenanceEntry } from './entities/maintenance-entry.entity';
import type { Rig } from './entities/rig.entity';

export type DetailRow = ContainerDetail | MainDetail | ReserveDetail | AadDetail;

export interface ItemInput {
  bulletins?: OpenBulletinNotice[];
  groundings?: GroundingView[];
  item: GearItem;
  detail: DetailRow | null;
  parts: ComponentPart[];
  model: GearModel | null;
  entries: MaintenanceEntry[];
}

function detailsFor(kind: GearKind, row: DetailRow | null): GearDetails {
  switch (kind) {
    case 'container': {
      const d = row as ContainerDetail | null;
      return { harnessSize: d?.harnessSize ?? null, tso: d?.tso ?? null };
    }
    case 'main': {
      const d = row as MainDetail | null;
      return { sizeSqft: d?.sizeSqft ?? null, lineType: d?.lineType ?? null };
    }
    case 'reserve': {
      const d = row as ReserveDetail | null;
      return {
        sizeSqft: d?.sizeSqft ?? null,
        repackCycleDays: d?.repackCycleDays ?? null,
        deployments: d?.deployments ?? 0,
      };
    }
    case 'aad': {
      const d = row as AadDetail | null;
      return {
        mode: d?.mode ?? null,
        batteryInstalledOn: d?.batteryInstalledOn ?? null,
        batteryCycleMonths: d?.batteryCycleMonths ?? null,
        serviceDueOn: d?.serviceDueOn ?? null,
        expiresOn: d?.expiresOn ?? null,
      };
    }
  }
}

export function toPartView(part: ComponentPart): ComponentPartView {
  return {
    id: part.id,
    gearItemId: part.gearItemId,
    kind: part.kind,
    description: part.description,
    serial: part.serial,
    manufacturedOn: part.manufacturedOn,
    notes: part.notes,
  };
}

function toPending(entry: MaintenanceEntry): PendingVerification {
  return {
    entryId: entry.id,
    gearItemId: entry.gearItemId,
    kind: entry.kind,
    performedOn: entry.performedOn,
    performedByName: entry.performedByName,
    performedByContact: entry.performedByContact,
  };
}

export function buildGearItemView(input: ItemInput, today: string): GearItemView {
  const { item, entries } = input;
  const details = detailsFor(item.kind, input.detail);
  const dues = computeDueItems({
    kind: item.kind,
    entries: entries.map((e) => ({ kind: e.kind, performedOn: e.performedOn, voided: e.voidedAt !== null })),
    manufacturedOn: item.manufacturedOn,
    details,
    model: input.model,
    today,
  });
  const pending = entries
    .filter((e) =>
      needsVerification({
        kind: e.kind,
        ownerReported: e.ownerReported,
        verifiedAt: e.verifiedAt === null ? null : e.verifiedAt.toISOString(),
        voided: e.voidedAt !== null,
      }),
    )
    .map(toPending);

  return {
    id: item.id,
    ownerId: item.ownerId,
    rigId: item.rigId,
    modelId: item.modelId,
    kind: item.kind,
    manufacturer: item.manufacturer,
    model: item.model,
    serial: item.serial,
    manufacturedOn: item.manufacturedOn,
    notes: item.notes,
    retiredAt: item.retiredAt === null ? null : item.retiredAt.toISOString(),
    details,
    parts: input.parts.map(toPartView),
    dues,
    status: dues.length === 0 ? 'ok' : worstStatus(dues.map((d) => d.status)),
    pendingVerification: pending,
    bulletins: input.bulletins ?? [],
    groundings: input.groundings ?? [],
  };
}

function isNewer(a: MaintenanceEntry, b: MaintenanceEntry): boolean {
  return a.performedOn > b.performedOn || (a.performedOn === b.performedOn && a.createdAt > b.createdAt);
}

function toInspection(entry: MaintenanceEntry): InspectionSummary {
  return {
    entryId: entry.id,
    gearItemId: entry.gearItemId,
    performedOn: entry.performedOn,
    result: entry.result as InspectionSummary['result'],
    performedByName: entry.performedByName,
    description: entry.description,
  };
}

export function buildRigView(
  rig: Rig,
  items: GearItemView[],
  entries: MaintenanceEntry[] = [],
  riggers: RiggerName[] = [],
  groundings: GroundingView[] = [],
): RigView {
  const slots = Object.fromEntries(
    GEAR_KINDS.map((kind) => [kind, items.find((i) => i.kind === kind) ?? null]),
  ) as Record<GearKind, GearItemView | null>;
  const statuses: DueStatus[] = items.map((i) => i.status);
  if (slots.reserve === null || slots.aad === null) {
    statuses.push('no_data');
  }
  const pending = items.flatMap((i) => i.pendingVerification);
  const reasons: ReadinessReason[] = pending.length > 0 ? [{ type: 'pending_verification', entries: pending }] : [];
  const inspections = entries
    .filter((e) => e.kind === 'inspection' && e.result !== null && e.voidedAt === null)
    .sort((a, b) => (isNewer(a, b) ? -1 : 1));
  const grounding = inspections.find((e) => e.result === 'grounded');
  if (grounding && !inspections.some((e) => e.result === 'passed' && isNewer(e, grounding))) {
    reasons.push({ type: 'inspection_grounded', inspection: toInspection(grounding) });
  }
  for (const open of groundings) {
    reasons.push({ type: 'grounding', grounding: open });
  }

  return {
    id: rig.id,
    ownerId: rig.ownerId,
    name: rig.name,
    notes: rig.notes,
    active: rig.active,
    slots,
    status: worstStatus(statuses),
    readiness: { state: reasons.length > 0 ? 'grounded' : 'airworthy', reasons },
    lastInspection: inspections[0] ? toInspection(inspections[0]) : null,
    riggers,
  };
}

export function buildOverview(
  rigs: {
    rig: Rig;
    items: GearItemView[];
    entries?: MaintenanceEntry[];
    riggers?: RiggerName[];
    groundings?: GroundingView[];
  }[],
  spares: GearItemView[],
): GearOverview {
  const rigViews = rigs.map(({ rig, items, entries, riggers, groundings }) =>
    buildRigView(rig, items, entries, riggers, groundings),
  );
  const summary = { overdue: 0, due_soon: 0, no_data: 0, ok: 0, grounded: 0 };
  for (const rig of rigViews.filter((r) => r.active)) {
    summary[rig.status] += 1;
    if (rig.readiness.state === 'grounded') {
      summary.grounded += 1;
    }
  }
  for (const spare of spares) {
    summary[spare.status] += 1;
  }
  return { rigs: rigViews, spares, summary };
}

export function toEntryView(entry: MaintenanceEntry): MaintenanceEntryView {
  return {
    id: entry.id,
    gearItemId: entry.gearItemId,
    kind: entry.kind,
    result: entry.result,
    performedOn: entry.performedOn,
    description: entry.description,
    performedById: entry.performedById,
    performedByName: entry.performedByName,
    performedByLicence: entry.performedByLicence,
    performedByContact: entry.performedByContact,
    ownerReported: entry.ownerReported,
    verifiedAt: entry.verifiedAt === null ? null : entry.verifiedAt.toISOString(),
    verifiedById: entry.verifiedById,
    voidedAt: entry.voidedAt === null ? null : entry.voidedAt.toISOString(),
    voidReason: entry.voidReason,
    createdAt: entry.createdAt.toISOString(),
  };
}
