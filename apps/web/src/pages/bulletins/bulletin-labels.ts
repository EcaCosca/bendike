import type { BulletinSeverity, BulletinStatus } from '@bendike/shared';

export const SEVERITY_LABELS: Record<BulletinSeverity, string> = {
  advisory: 'Advisory',
  mandatory: 'Mandatory',
  grounding: 'Grounding',
};

export const SEVERITY_COLORS: Record<BulletinSeverity, 'default' | 'warning' | 'error'> = {
  advisory: 'default',
  mandatory: 'warning',
  grounding: 'error',
};

export const STATUS_LABELS: Record<BulletinStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  withdrawn: 'Withdrawn',
};
