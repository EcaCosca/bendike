import { statusSeverity, type DueStatus, type GearItemView, type GearKind, type RigView } from '@bendike/shared';
import { mostUrgentDue } from './gear-status';

export type StatusFilter = DueStatus | 'grounded';

export interface GearFilters {
  status?: StatusFilter;
  kind?: GearKind;
  search?: string;
}

export type RigSort = 'urgent' | 'name';

function matchesSearch(rig: RigView, needle: string): boolean {
  const parts = [rig.name, rig.notes];
  for (const item of Object.values(rig.slots)) {
    if (item) {
      parts.push(item.manufacturer, item.model, item.serial ?? '');
    }
  }
  return parts.some((part) => part.toLowerCase().includes(needle));
}

export function filterRigs(rigs: readonly RigView[], filters: GearFilters): RigView[] {
  const needle = filters.search?.trim().toLowerCase();
  return rigs.filter((rig) => {
    if (needle && !matchesSearch(rig, needle)) {
      return false;
    }
    if (filters.kind && rig.slots[filters.kind] === null) {
      return false;
    }
    if (filters.status === 'grounded') {
      return rig.readiness.state === 'grounded';
    }
    if (filters.status) {
      const status = filters.kind ? (rig.slots[filters.kind]?.status ?? 'no_data') : rig.status;
      return status === filters.status;
    }
    return true;
  });
}

export function filterSpares(spares: readonly GearItemView[], filters: GearFilters): GearItemView[] {
  const needle = filters.search?.trim().toLowerCase();
  return spares.filter((item) => {
    if (needle && ![item.manufacturer, item.model, item.serial ?? ''].some((p) => p.toLowerCase().includes(needle))) {
      return false;
    }
    if (filters.kind && item.kind !== filters.kind) {
      return false;
    }
    if (filters.status === 'grounded') {
      return item.pendingVerification.length > 0;
    }
    return filters.status ? item.status === filters.status : true;
  });
}

function nameOrder(a: RigView, b: RigView): number {
  return a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true });
}

function firstDue(rig: RigView): string {
  const dues = Object.values(rig.slots).flatMap((item) => (item ? [mostUrgentDue(item.dues)] : []));
  return dues.map((d) => d?.dueOn ?? '9999').sort()[0] ?? '9999';
}

export function sortRigs(rigs: readonly RigView[], sort: RigSort): RigView[] {
  const copy = [...rigs];
  if (sort === 'name') {
    return copy.sort(nameOrder);
  }
  const rank = (rig: RigView) => (rig.readiness.state === 'grounded' ? 4 : statusSeverity(rig.status));
  return copy.sort((a, b) => rank(b) - rank(a) || firstDue(a).localeCompare(firstDue(b)) || nameOrder(a, b));
}
