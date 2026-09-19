import {
  GEAR_KINDS,
  statusSeverity,
  type DueItem,
  type GearItemView,
  type GearKind,
  type GearOverview,
  type RigView,
} from '@bendike/shared';
import { filterRigs, sortRigs, type GearFilters, type RigSort } from './gear-filters';
import { mostUrgentDue } from './gear-status';

export interface EquipmentRow {
  item: GearItemView;
  rig: RigView | null;
}

const NO_DUE = '9999';

function matches(row: EquipmentRow, filters: GearFilters): boolean {
  const { item, rig } = row;
  const needle = filters.search?.trim().toLowerCase();
  if (needle) {
    const parts = [item.manufacturer, item.model, item.serial ?? '', item.notes, rig?.name ?? ''];
    if (!parts.some((part) => part.toLowerCase().includes(needle))) {
      return false;
    }
  }
  if (filters.kind && item.kind !== filters.kind) {
    return false;
  }
  if (filters.status === 'grounded') {
    return rig ? rig.readiness.state === 'grounded' : item.pendingVerification.length > 0;
  }
  if (filters.status) {
    return (rig?.active ?? true) && item.status === filters.status;
  }
  return true;
}

function nextDueOn(item: GearItemView): string {
  return mostUrgentDue(item.dues)?.dueOn ?? NO_DUE;
}

function byRigThenKind(a: EquipmentRow, b: EquipmentRow): number {
  if (a.rig && b.rig && a.rig.id !== b.rig.id) {
    return a.rig.name.localeCompare(b.rig.name, 'en', { sensitivity: 'base', numeric: true });
  }
  if (!a.rig !== !b.rig) {
    return a.rig ? -1 : 1;
  }
  return (
    GEAR_KINDS.indexOf(a.item.kind) - GEAR_KINDS.indexOf(b.item.kind) ||
    a.item.manufacturer.localeCompare(b.item.manufacturer, 'en', { sensitivity: 'base' })
  );
}

function byUrgency(a: EquipmentRow, b: EquipmentRow): number {
  const inactive = Number(a.rig?.active === false) - Number(b.rig?.active === false);
  return (
    inactive ||
    statusSeverity(b.item.status) - statusSeverity(a.item.status) ||
    nextDueOn(a.item).localeCompare(nextDueOn(b.item)) ||
    byRigThenKind(a, b)
  );
}

export function equipmentRows(
  overview: Pick<GearOverview, 'rigs' | 'spares'>,
  filters: GearFilters,
  sort: RigSort,
): EquipmentRow[] {
  const rows: EquipmentRow[] = [
    ...overview.rigs.flatMap((rig) =>
      GEAR_KINDS.flatMap((kind) => {
        const item = rig.slots[kind];
        return item ? [{ item, rig }] : [];
      }),
    ),
    ...overview.spares.map((item) => ({ item, rig: null })),
  ];
  return rows.filter((row) => matches(row, filters)).sort(sort === 'name' ? byRigThenKind : byUrgency);
}

export function rigRows(rigs: readonly RigView[], filters: GearFilters, sort: RigSort): RigView[] {
  const visible = filterRigs(rigs, filters);
  return [
    ...sortRigs(
      visible.filter((rig) => rig.active),
      sort,
    ),
    ...sortRigs(
      visible.filter((rig) => !rig.active),
      sort,
    ),
  ];
}

export function rigNextDue(rig: RigView): { kind: GearKind; due: DueItem } | null {
  const candidates = GEAR_KINDS.flatMap((kind) => {
    const due = mostUrgentDue(rig.slots[kind]?.dues ?? []);
    return due ? [{ kind, due }] : [];
  });
  return (
    candidates.sort(
      (a, b) =>
        statusSeverity(b.due.status) - statusSeverity(a.due.status) ||
        (a.due.dueOn ?? NO_DUE).localeCompare(b.due.dueOn ?? NO_DUE),
    )[0] ?? null
  );
}
