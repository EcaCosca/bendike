import { statusSeverity } from './due-dates';
import type { DueKind, DueStatus, GearKind, MaintenanceKind } from './gear';
import type { Locale } from './locale';
import type { Role } from './roles';

export const LINK_STATUSES = ['pending', 'active', 'declined', 'ended'] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

export interface LinkCounterpart {
  id: string;
  displayName: string;
  role: Role;
  email: string | null;
  phone: string | null;
}

export interface RiggerLinkView {
  id: string;
  status: LinkStatus;
  direction: 'incoming' | 'outgoing';
  viewerIsOwner: boolean;
  counterpart: LinkCounterpart;
  createdAt: string;
  confirmedAt: string | null;
}

export interface RiggerSummary {
  id: string;
  displayName: string;
}

export interface CreateRiggerLinkRequestBody {
  riggerId?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerId?: string;
}

export interface WorkItemOwner {
  id: string;
  displayName: string;
  role: Role;
  phone: string | null;
  email: string;
  locale: Locale;
}

export interface WorkItem {
  id: string;
  owner: WorkItemOwner;
  rig: { id: string; name: string; grounded: boolean } | null;
  item: { id: string; kind: GearKind; manufacturer: string; model: string; serial: string | null };
  dueKind: DueKind;
  dueOn: string | null;
  daysLeft: number | null;
  status: DueStatus;
}

export interface VerificationRow {
  entryId: string;
  owner: WorkItemOwner;
  rig: { id: string; name: string } | null;
  item: { id: string; kind: GearKind; manufacturer: string; model: string };
  kind: MaintenanceKind;
  performedOn: string;
  performedByName: string;
  performedByContact: string | null;
}

export type WorkSort = 'urgency' | 'due' | 'owner' | 'rig';
export type WorkStatusFilter = DueStatus | 'all' | 'grounded';

export interface WorkQueueQuery {
  status?: WorkStatusFilter;
  kind?: GearKind;
  dueKind?: DueKind;
  ownerId?: string;
  withinDays?: number;
  search?: string;
  sort?: WorkSort;
  page?: number;
  pageSize?: number;
}

export interface WorkQueueCounts {
  overdue: number;
  due_soon: number;
  no_data: number;
  awaitingVerification: number;
  grounded: number;
}

export interface GroundedRigRow {
  rig: { id: string; name: string };
  owner: { id: string; displayName: string };
  reasons: string[];
}

export interface WorkQueueResponse {
  items: WorkItem[];
  total: number;
  page: number;
  pageSize: number;
  counts: WorkQueueCounts;
  owners: { id: string; displayName: string }[];
  verifications: VerificationRow[];
  groundedRigs: GroundedRigRow[];
}

export interface CustomerSummary {
  owner: WorkItemOwner;
  rigs: number;
  overdue: number;
  dueSoon: number;
  grounded: number;
}

export const WORK_PAGE_SIZE = 25;

function urgencyRank(item: WorkItem): number {
  return item.rig?.grounded ? 4 : statusSeverity(item.status);
}

function byDate(a: WorkItem, b: WorkItem): number {
  return (a.dueOn ?? '9999-12-31').localeCompare(b.dueOn ?? '9999-12-31');
}

function byName(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true });
}

export function sortWorkItems(items: readonly WorkItem[], sort: WorkSort): WorkItem[] {
  const copy = [...items];
  switch (sort) {
    case 'urgency':
      return copy.sort(
        (a, b) => urgencyRank(b) - urgencyRank(a) || byDate(a, b) || byName(a.owner.displayName, b.owner.displayName),
      );
    case 'due':
      return copy.sort((a, b) => byDate(a, b) || byName(a.owner.displayName, b.owner.displayName));
    case 'owner':
      return copy.sort(
        (a, b) =>
          byName(a.owner.displayName, b.owner.displayName) ||
          byName(a.rig?.name ?? '', b.rig?.name ?? '') ||
          byDate(a, b),
      );
    case 'rig':
      return copy.sort((a, b) => byName(a.rig?.name ?? '~', b.rig?.name ?? '~') || byDate(a, b));
  }
}

function matchesSearch(item: WorkItem, needle: string): boolean {
  return [
    item.owner.displayName,
    item.rig?.name ?? '',
    item.item.manufacturer,
    item.item.model,
    item.item.serial ?? '',
  ].some((part) => part.toLowerCase().includes(needle));
}

export function filterWorkItems(items: readonly WorkItem[], query: WorkQueueQuery): WorkItem[] {
  const needle = query.search?.trim().toLowerCase();
  return items.filter((item) => {
    if (query.ownerId && item.owner.id !== query.ownerId) return false;
    if (query.kind && item.item.kind !== query.kind) return false;
    if (query.dueKind && item.dueKind !== query.dueKind) return false;
    if (query.withinDays !== undefined && (item.daysLeft === null || item.daysLeft > query.withinDays)) return false;
    if (needle && !matchesSearch(item, needle)) return false;
    const status = query.status;
    if (status === 'grounded') return item.rig?.grounded === true;
    if (status === 'all') return true;
    if (status) return item.status === status;
    return item.status !== 'ok';
  });
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): { page: T[]; total: number } {
  const start = (page - 1) * pageSize;
  return { page: items.slice(start, start + pageSize), total: items.length };
}
