import { Inject, Injectable } from '@nestjs/common';
import {
  contactLink,
  isDueForDigest,
  type BulletinMatchView,
  type DeliveryHistory,
  type DigestStatus,
} from '@bendike/shared';
import type { User } from '../users/user.entity';
import { MatchesService } from '../bulletins/matches.service';
import { WorkQueueService, type WorkCollection } from '../work-queue/work-queue.service';
import type { Digest, DigestItem, DigestItemKey, DigestSection } from './digest';
import type { DigestDelivery } from './digest-delivery.entity';

export interface WorkCollector {
  collect(actor: User): Promise<WorkCollection>;
}

export interface OpenMatches {
  list(actor: User, filter: { status: 'open' }): Promise<BulletinMatchView[]>;
}

const SECTION_ORDER: Record<DigestSection, number> = {
  overdue: 0,
  due_soon: 1,
  grounded: 2,
  bulletin: 3,
  verification: 4,
};

function historyOf(deliveries: readonly DigestDelivery[], key: DigestItemKey): DeliveryHistory | null {
  const found = deliveries.find((d) => d.subjectId === key.subjectId && d.kind === key.kind && d.dueKey === key.dueKey);
  return found ? { sentOn: found.sentOn, status: found.lastStatus as DigestStatus } : null;
}

@Injectable()
export class DigestBuilder {
  constructor(
    @Inject(WorkQueueService) private readonly queue: WorkCollector,
    @Inject(MatchesService) private readonly matches: OpenMatches,
  ) {}

  async build(rigger: User, deliveries: readonly DigestDelivery[], today: string): Promise<Digest | null> {
    const { items: work, verifications, groundedRigs } = await this.queue.collect(rigger);
    const items: DigestItem[] = [];

    for (const entry of work) {
      if (entry.status !== 'overdue' && entry.status !== 'due_soon') continue;
      const key = { subjectId: entry.item.id, kind: entry.dueKind, dueKey: entry.dueOn ?? 'none' };
      if (!isDueForDigest(entry.status, historyOf(deliveries, key), today)) continue;
      items.push({
        key,
        section: entry.status,
        status: entry.status,
        ownerName: entry.owner.displayName,
        ownerPhone: entry.owner.phone,
        ownerEmail: entry.owner.email,
        rigName: entry.rig?.name ?? null,
        componentLabel: `${entry.item.manufacturer} ${entry.item.model}`,
        dueKind: entry.dueKind,
        dueOn: entry.dueOn,
        daysLeft: entry.daysLeft,
        contactUrl: contactLink(entry.owner, {
          locale: entry.owner.locale,
          ownerName: entry.owner.displayName,
          riggerName: rigger.displayName,
          rigName: entry.rig?.name ?? null,
          componentLabel: `${entry.item.manufacturer} ${entry.item.model}`,
          dueKind: entry.dueKind,
          dueOn: entry.dueOn,
          daysLeft: entry.daysLeft,
        }),
      });
    }

    for (const row of verifications) {
      const key = { subjectId: row.entryId, kind: 'verification', dueKey: 'none' };
      if (!isDueForDigest('pending', historyOf(deliveries, key), today)) continue;
      items.push({
        key,
        section: 'verification',
        status: 'pending',
        ownerName: row.owner.displayName,
        ownerPhone: row.owner.phone,
        ownerEmail: row.owner.email,
        rigName: row.rig?.name ?? null,
        componentLabel: `${row.item.manufacturer} ${row.item.model}`,
        dueKind: null,
        dueOn: null,
        daysLeft: null,
        contactUrl: null,
        verification: {
          kind: row.kind,
          performedOn: row.performedOn,
          performedByName: row.performedByName,
          performedByContact: row.performedByContact,
        },
      });
    }

    for (const grounded of groundedRigs) {
      const key = { subjectId: grounded.rig.id, kind: 'grounded', dueKey: 'none' };
      if (!isDueForDigest('pending', historyOf(deliveries, key), today)) continue;
      items.push({
        key,
        section: 'grounded',
        status: 'pending',
        ownerName: grounded.owner.displayName,
        ownerPhone: null,
        ownerEmail: '',
        rigName: grounded.rig.name,
        componentLabel: '',
        dueKind: null,
        dueOn: null,
        daysLeft: null,
        contactUrl: null,
        note: grounded.reasons.join('; '),
      });
    }

    for (const match of await this.matches.list(rigger, { status: 'open' })) {
      const key = { subjectId: match.id, kind: 'bulletin', dueKey: 'none' };
      if (!isDueForDigest('pending', historyOf(deliveries, key), today)) continue;
      const review =
        match.confidence === 'needs_review' ? ' (needs review: the serial or date could not be compared)' : '';
      items.push({
        key,
        section: 'bulletin',
        status: 'pending',
        ownerName: match.owner.displayName,
        ownerPhone: null,
        ownerEmail: '',
        rigName: match.rig?.name ?? null,
        componentLabel: `${match.item.manufacturer} ${match.item.model}`,
        dueKind: null,
        dueOn: null,
        daysLeft: null,
        contactUrl: null,
        note: `${match.bulletin.reference} (${match.bulletin.severity}): ${match.bulletin.title}. ${match.bulletin.requiredAction}${review}`,
      });
    }

    if (items.length === 0) {
      return null;
    }
    items.sort(
      (a, b) =>
        SECTION_ORDER[a.section] - SECTION_ORDER[b.section] ||
        (a.dueOn ?? a.verification?.performedOn ?? '').localeCompare(b.dueOn ?? b.verification?.performedOn ?? ''),
    );
    return {
      rigger: { id: rigger.id, displayName: rigger.displayName, email: rigger.email, locale: rigger.locale },
      items,
    };
  }
}
