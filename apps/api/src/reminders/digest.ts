import type { DigestStatus, DueKind, Locale, MaintenanceKind } from '@bendike/shared';

export type DigestSection = 'overdue' | 'due_soon' | 'grounded' | 'bulletin' | 'verification';

export interface DigestItemKey {
  subjectId: string;
  kind: string;
  dueKey: string;
}

export interface DigestItem {
  key: DigestItemKey;
  section: DigestSection;
  status: DigestStatus;
  ownerName: string;
  ownerPhone: string | null;
  ownerEmail: string;
  rigName: string | null;
  componentLabel: string;
  dueKind: DueKind | null;
  dueOn: string | null;
  daysLeft: number | null;
  contactUrl: string | null;
  note?: string;
  verification?: {
    kind: MaintenanceKind;
    performedOn: string;
    performedByName: string;
    performedByContact: string | null;
  };
}

export interface Digest {
  rigger: { id: string; displayName: string; email: string; locale: Locale };
  items: DigestItem[];
}
