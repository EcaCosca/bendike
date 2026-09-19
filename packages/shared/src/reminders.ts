import { daysUntil } from './due-dates';

export type DigestStatus = 'due_soon' | 'overdue' | 'pending';

export interface DeliveryHistory {
  sentOn: string;
  status: DigestStatus;
}

export const DIGEST_INTERVAL_DAYS: Record<DigestStatus, number> = { due_soon: 7, overdue: 3, pending: 7 };

export function isDueForDigest(status: DigestStatus, history: DeliveryHistory | null, today: string): boolean {
  if (history === null) {
    return true;
  }
  const daysSince = daysUntil(today, history.sentOn);
  if (daysSince < 1) {
    return false;
  }
  return history.status !== status || daysSince >= DIGEST_INTERVAL_DAYS[status];
}
