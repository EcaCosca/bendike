import { DUE_STATUSES, statusSeverity, type DueItem, type DueStatus } from '@bendike/shared';

export type StatusIcon = 'overdue' | 'due_soon' | 'ok' | 'no_data';

export const STATUS_META: Record<
  DueStatus,
  { label: string; color: 'error' | 'warning' | 'success' | 'default'; icon: StatusIcon }
> = {
  overdue: { label: 'Overdue', color: 'error', icon: 'overdue' },
  due_soon: { label: 'Due soon', color: 'warning', icon: 'due_soon' },
  ok: { label: 'OK', color: 'success', icon: 'ok' },
  no_data: { label: 'No data', color: 'default', icon: 'no_data' },
};

export const STATUS_ORDER: readonly DueStatus[] = DUE_STATUSES;

export const DUE_KIND_LABELS: Record<DueItem['kind'], string> = {
  repack: 'Repack',
  battery: 'Battery',
  service: 'Service',
  expiry: 'Expiry',
};

export function describeDays(daysLeft: number): string {
  if (daysLeft === 0) return 'today';
  if (daysLeft === 1) return 'tomorrow';
  if (daysLeft === -1) return 'yesterday';
  return daysLeft > 0 ? `in ${daysLeft} days` : `${-daysLeft} days overdue`;
}

export function dueText(due: DueItem): string {
  const label = DUE_KIND_LABELS[due.kind];
  return due.dueOn === null || due.daysLeft === null
    ? `${label}: no data`
    : `${label} ${due.dueOn} · ${describeDays(due.daysLeft)}`;
}

export function mostUrgentDue(dues: readonly DueItem[]): DueItem | null {
  if (dues.length === 0) {
    return null;
  }
  return [...dues].sort(
    (a, b) =>
      statusSeverity(b.status) - statusSeverity(a.status) || (a.dueOn ?? '9999').localeCompare(b.dueOn ?? '9999'),
  )[0] as DueItem;
}
