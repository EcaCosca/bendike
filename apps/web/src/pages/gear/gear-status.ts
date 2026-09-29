import { DUE_STATUSES, statusSeverity, type DueItem, type DueStatus } from '@bendike/shared';
import type { TFunction } from 'i18next';
import i18n from '../../i18n/i18n';

export type StatusIcon = 'overdue' | 'due_soon' | 'ok' | 'no_data';

export const STATUS_META: Record<DueStatus, { color: 'error' | 'warning' | 'success' | 'default'; icon: StatusIcon }> =
  {
    overdue: { color: 'error', icon: 'overdue' },
    due_soon: { color: 'warning', icon: 'due_soon' },
    ok: { color: 'success', icon: 'ok' },
    no_data: { color: 'default', icon: 'no_data' },
  };

export const STATUS_ORDER: readonly DueStatus[] = DUE_STATUSES;

export const STATUS_LABEL_KEYS: Record<DueStatus, string> = {
  overdue: 'gear.status.overdue',
  due_soon: 'gear.status.due_soon',
  ok: 'gear.status.ok',
  no_data: 'gear.status.no_data',
};

export const DUE_KIND_LABEL_KEYS: Record<DueItem['kind'], string> = {
  repack: 'gear.dueKind.repack',
  battery: 'gear.dueKind.battery',
  service: 'gear.dueKind.service',
  expiry: 'gear.dueKind.expiry',
};

export function describeDays(daysLeft: number, t: TFunction = i18n.t): string {
  if (daysLeft === 0) return t('gear.due.today');
  if (daysLeft === 1) return t('gear.due.tomorrow');
  if (daysLeft === -1) return t('gear.due.yesterday');
  return daysLeft > 0 ? t('gear.due.inDays', { count: daysLeft }) : t('gear.due.daysOverdue', { count: -daysLeft });
}

export function dueText(due: DueItem, t: TFunction = i18n.t): string {
  const kind = t(DUE_KIND_LABEL_KEYS[due.kind]);
  return due.dueOn === null || due.daysLeft === null
    ? t('gear.due.noData', { kind })
    : t('gear.due.line', { kind, date: due.dueOn, days: describeDays(due.daysLeft, t) });
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
