import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Role, type BulletinMatchView, type MatchStatus, type ResolveMatchRequestBody } from '@bendike/shared';
import { In, IsNull, type EntityManager } from 'typeorm';
import { GearItem } from '../gear/entities/gear-item.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearAccessService } from '../gear/gear-access.service';
import { RiggerLinksService } from '../rigger-links/rigger-links.service';
import { User } from '../users/user.entity';
import { BulletinMatch, Grounding, ServiceBulletin } from './entities';
import type { ActiveOwners } from './bulletins.service';

export interface MatchFilter {
  bulletinId?: string;
  status?: MatchStatus;
}

@Injectable()
export class MatchesService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly access: GearAccessService,
    @Inject(RiggerLinksService) private readonly links: ActiveOwners,
  ) {}

  async list(actor: User, filter: MatchFilter): Promise<BulletinMatchView[]> {
    this.assertRigger(actor);
    const items =
      actor.role === Role.Admin
        ? await this.manager.find(GearItem, { where: { retiredAt: IsNull() } })
        : await this.itemsInScope(actor);
    if (items.length === 0) {
      return [];
    }
    const matches = await this.manager.find(BulletinMatch, {
      where: {
        gearItemId: In(items.map((i) => i.id)),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.bulletinId ? { bulletinId: filter.bulletinId } : {}),
      },
    });
    if (matches.length === 0) {
      return [];
    }
    const bulletins = await this.manager.find(ServiceBulletin, {
      where: { id: In([...new Set(matches.map((m) => m.bulletinId))]), status: 'published' },
    });
    const rigs = await this.manager.find(Rig, {
      where: { id: In([...new Set(items.flatMap((i) => (i.rigId ? [i.rigId] : [])))]) },
    });
    const owners = await this.manager.find(User, { where: { id: In([...new Set(items.map((i) => i.ownerId))]) } });
    const views: BulletinMatchView[] = [];
    for (const match of matches) {
      const bulletin = bulletins.find((b) => b.id === match.bulletinId);
      const item = items.find((i) => i.id === match.gearItemId);
      const owner = owners.find((o) => o.id === item?.ownerId);
      if (!bulletin || !item || !owner) continue;
      const rig = rigs.find((r) => r.id === item.rigId);
      views.push(this.toView(match, bulletin, item, owner, rig));
    }
    return views.sort(
      (a, b) =>
        a.bulletin.reference.localeCompare(b.bulletin.reference) ||
        a.owner.displayName.localeCompare(b.owner.displayName),
    );
  }

  async resolve(actor: User, matchId: string, body: ResolveMatchRequestBody): Promise<BulletinMatchView> {
    this.assertRigger(actor);
    const match = await this.manager.findOne(BulletinMatch, { where: { id: matchId } });
    const item = match ? await this.manager.findOne(GearItem, { where: { id: match.gearItemId } }) : null;
    if (!match || !item) {
      throw new NotFoundException('Match not found');
    }
    await this.access.assertSignOff(actor, item.ownerId);
    const note = body.note.trim();
    if (!note) {
      throw new BadRequestException(body.status === 'complied' ? 'Say what was done' : 'Say why it does not apply');
    }
    if (match.status !== 'open') {
      throw new ConflictException('The match is already resolved');
    }
    const now = new Date();
    match.status = body.status;
    match.resolutionNote = note;
    match.resolvedBy = actor.id;
    match.resolvedAt = now;
    await this.manager.save(match);
    for (const grounding of await this.manager.find(Grounding, {
      where: { bulletinMatchId: match.id, closedAt: IsNull() },
    })) {
      grounding.closedBy = actor.id;
      grounding.closedAt = now;
      grounding.closeNote = note;
      await this.manager.save(grounding);
    }
    const bulletin = await this.manager.findOne(ServiceBulletin, { where: { id: match.bulletinId } });
    const owner = await this.manager.findOne(User, { where: { id: item.ownerId } });
    if (!bulletin || !owner) {
      throw new NotFoundException('Match not found');
    }
    const rig = item.rigId ? await this.manager.findOne(Rig, { where: { id: item.rigId } }) : null;
    return this.toView(match, bulletin, item, owner, rig ?? undefined);
  }

  private assertRigger(actor: User): void {
    if (actor.role !== Role.Rigger && actor.role !== Role.Admin) {
      throw new ForbiddenException('Only riggers work with bulletin matches');
    }
  }

  private async itemsInScope(actor: User): Promise<GearItem[]> {
    const owners = await this.links.activeOwnerIds(actor.id);
    return owners.length === 0
      ? []
      : this.manager.find(GearItem, { where: { ownerId: In(owners), retiredAt: IsNull() } });
  }

  private toView(
    match: BulletinMatch,
    bulletin: ServiceBulletin,
    item: GearItem,
    owner: User,
    rig: Rig | undefined,
  ): BulletinMatchView {
    return {
      id: match.id,
      bulletin: {
        id: bulletin.id,
        manufacturer: bulletin.manufacturer,
        reference: bulletin.reference,
        title: bulletin.title,
        severity: bulletin.severity,
        requiredAction: bulletin.requiredAction,
        sourceUrl: bulletin.sourceUrl,
      },
      confidence: match.confidence,
      status: match.status,
      resolutionNote: match.resolutionNote,
      resolvedAt: match.resolvedAt === null ? null : match.resolvedAt.toISOString(),
      owner: { id: owner.id, displayName: owner.displayName },
      rig: rig ? { id: rig.id, name: rig.name } : null,
      item: { id: item.id, kind: item.kind, manufacturer: item.manufacturer, model: item.model, serial: item.serial },
    };
  }
}
