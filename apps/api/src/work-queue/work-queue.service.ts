import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  Role,
  WORK_PAGE_SIZE,
  filterWorkItems,
  paginate,
  sortWorkItems,
  type CustomerSummary,
  type GearOverview,
  type GroundedRigRow,
  describeReason,
  type VerificationRow,
  type WorkItem,
  type WorkItemOwner,
  type WorkQueueCounts,
  type WorkQueueQuery,
  type WorkQueueResponse,
} from '@bendike/shared';
import { In, type EntityManager } from 'typeorm';
import { GearItem } from '../gear/entities/gear-item.entity';
import { GearReadService } from '../gear/gear-read.service';
import { RiggerLinksService } from '../rigger-links/rigger-links.service';
import { User } from '../users/user.entity';

export interface ActiveOwnersLookup {
  activeOwnerIds(riggerId: string): Promise<string[]>;
}

const MAX_PAGE_SIZE = 100;

export interface WorkCollection {
  items: WorkItem[];
  verifications: VerificationRow[];
  groundedRigs: GroundedRigRow[];
  counts: WorkQueueCounts;
  owners: { id: string; displayName: string }[];
}

function toOwner(user: User): WorkItemOwner {
  return {
    id: user.id,
    displayName: user.displayName,
    role: user.role,
    phone: user.phone,
    email: user.email,
    locale: user.locale,
  };
}

@Injectable()
export class WorkQueueService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly read: GearReadService,
    @Inject(RiggerLinksService) private readonly links: ActiveOwnersLookup,
  ) {}

  async collect(actor: User): Promise<WorkCollection> {
    const scope = await this.load(actor);
    const items: WorkItem[] = [];
    const verifications: VerificationRow[] = [];
    const groundedRigs: GroundedRigRow[] = [];
    let grounded = 0;
    const counts = { overdue: 0, due_soon: 0, no_data: 0 };

    for (const { owner, overview } of scope) {
      const spares = overview.spares.map((item) => ({
        rig: null,
        items: [item],
        grounded: false,
        pending: item.pendingVerification,
        reasons: [] as string[],
      }));
      const rigs = overview.rigs
        .filter((rig) => rig.active)
        .map((rig) => ({
          rig: { id: rig.id, name: rig.name },
          items: Object.values(rig.slots).flatMap((item) => (item ? [item] : [])),
          grounded: rig.readiness.state === 'grounded',
          pending: rig.readiness.reasons.flatMap((reason) =>
            reason.type === 'pending_verification' ? reason.entries : [],
          ),
          reasons: [...new Set(rig.readiness.reasons.map(describeReason))],
        }));
      for (const group of [...rigs, ...spares]) {
        if (group.grounded) {
          grounded += 1;
          if (group.rig) {
            groundedRigs.push({
              rig: group.rig,
              owner: { id: owner.id, displayName: owner.displayName },
              reasons: group.reasons,
            });
          }
        }
        for (const item of group.items) {
          for (const due of item.dues) {
            items.push({
              id: `${item.id}:${due.kind}`,
              owner,
              rig: group.rig ? { ...group.rig, grounded: group.grounded } : null,
              item: {
                id: item.id,
                kind: item.kind,
                manufacturer: item.manufacturer,
                model: item.model,
                serial: item.serial,
              },
              dueKind: due.kind,
              dueOn: due.dueOn,
              daysLeft: due.daysLeft,
              status: due.status,
            });
            if (due.status !== 'ok') counts[due.status] += 1;
          }
        }
        for (const entry of group.pending) {
          const item = group.items.find((i) => i.id === entry.gearItemId);
          if (!item) continue;
          verifications.push({
            entryId: entry.entryId,
            owner,
            rig: group.rig,
            item: { id: item.id, kind: item.kind, manufacturer: item.manufacturer, model: item.model },
            kind: entry.kind,
            performedOn: entry.performedOn,
            performedByName: entry.performedByName,
            performedByContact: entry.performedByContact,
          });
        }
      }
    }

    return {
      items,
      verifications,
      groundedRigs,
      counts: { ...counts, awaitingVerification: verifications.length, grounded },
      owners: scope.map(({ owner }) => ({ id: owner.id, displayName: owner.displayName })),
    };
  }

  async queue(actor: User, query: WorkQueueQuery): Promise<WorkQueueResponse> {
    const { items, verifications, groundedRigs, counts, owners } = await this.collect(actor);
    const pageSize = Math.min(query.pageSize ?? WORK_PAGE_SIZE, MAX_PAGE_SIZE);
    const page = Math.max(query.page ?? 1, 1);
    const sorted = sortWorkItems(filterWorkItems(items, query), query.sort ?? 'urgency');
    const paged = paginate(sorted, page, pageSize);
    return { items: paged.page, total: paged.total, page, pageSize, counts, owners, verifications, groundedRigs };
  }

  async customers(actor: User): Promise<CustomerSummary[]> {
    const scope = await this.load(actor);
    return scope.map(({ owner, overview }) => {
      const active = overview.rigs.filter((rig) => rig.active);
      return {
        owner,
        rigs: active.length,
        overdue: active.filter((r) => r.status === 'overdue').length,
        dueSoon: active.filter((r) => r.status === 'due_soon').length,
        grounded: active.filter((r) => r.readiness.state === 'grounded').length,
      };
    });
  }

  private async load(actor: User): Promise<{ owner: WorkItemOwner; overview: GearOverview }[]> {
    if (actor.role !== Role.Rigger && actor.role !== Role.Admin) {
      throw new ForbiddenException('Only riggers use the work queue');
    }
    const ownerIds =
      actor.role === Role.Admin ? await this.everyOwnerWithGear() : await this.links.activeOwnerIds(actor.id);
    if (ownerIds.length === 0) {
      return [];
    }
    const owners = await this.manager.find(User, { where: { id: In(ownerIds) } });
    owners.sort((a, b) => a.displayName.localeCompare(b.displayName, 'en', { sensitivity: 'base' }));
    return Promise.all(
      owners.map(async (owner) => ({ owner: toOwner(owner), overview: await this.read.overview(actor, owner.id) })),
    );
  }

  private async everyOwnerWithGear(): Promise<string[]> {
    const items = await this.manager.find(GearItem, {});
    return [...new Set(items.map((i) => i.ownerId))];
  }
}
