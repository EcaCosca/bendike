import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  Role,
  type BulletinTargetInput,
  type BulletinView,
  type CreateBulletinRequestBody,
  type UpdateBulletinRequestBody,
} from '@bendike/shared';
import { In, IsNull, type EntityManager } from 'typeorm';
import { GearItem } from '../gear/entities/gear-item.entity';
import { RiggerLinksService } from '../rigger-links/rigger-links.service';
import type { User } from '../users/user.entity';
import { BulletinMatcher } from './bulletin-matcher';
import { BulletinMatch, BulletinTarget, Grounding, ServiceBulletin } from './entities';

export interface ActiveOwners {
  activeOwnerIds(riggerId: string): Promise<string[]>;
}

function blank(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class BulletinsService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly matcher: BulletinMatcher,
    @Inject(RiggerLinksService) private readonly links: ActiveOwners,
  ) {}

  async list(actor: User): Promise<BulletinView[]> {
    if (actor.role !== Role.Admin && actor.role !== Role.Rigger) {
      throw new ForbiddenException('Only riggers and admins read bulletins');
    }
    const bulletins = await this.manager.find(
      ServiceBulletin,
      actor.role === Role.Admin ? {} : { where: { status: 'published' } },
    );
    bulletins.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const scope = actor.role === Role.Admin ? null : await this.links.activeOwnerIds(actor.id);
    return Promise.all(bulletins.map((bulletin) => this.view(bulletin, scope)));
  }

  async create(actor: User, body: CreateBulletinRequestBody): Promise<BulletinView> {
    this.assertAdmin(actor);
    const bulletin = await this.manager.save(
      this.manager.create(ServiceBulletin, {
        manufacturer: body.manufacturer.trim(),
        reference: body.reference.trim(),
        title: body.title.trim(),
        summary: body.summary.trim(),
        requiredAction: body.requiredAction.trim(),
        sourceUrl: blank(body.sourceUrl),
        issuedOn: body.issuedOn,
        severity: body.severity,
        status: 'draft',
        createdBy: actor.id,
        publishedAt: null,
      }),
    );
    await this.replaceTargets(bulletin.id, body.targets);
    return this.view(bulletin, null);
  }

  async update(actor: User, id: string, body: UpdateBulletinRequestBody): Promise<BulletinView> {
    this.assertAdmin(actor);
    const bulletin = await this.find(id);
    if (bulletin.status === 'withdrawn') {
      throw new ConflictException('A withdrawn bulletin cannot be edited');
    }
    if (body.manufacturer !== undefined) bulletin.manufacturer = body.manufacturer.trim();
    if (body.reference !== undefined) bulletin.reference = body.reference.trim();
    if (body.title !== undefined) bulletin.title = body.title.trim();
    if (body.summary !== undefined) bulletin.summary = body.summary.trim();
    if (body.requiredAction !== undefined) bulletin.requiredAction = body.requiredAction.trim();
    if (body.sourceUrl !== undefined) bulletin.sourceUrl = blank(body.sourceUrl);
    if (body.issuedOn !== undefined) bulletin.issuedOn = body.issuedOn;
    if (body.severity !== undefined) bulletin.severity = body.severity;
    await this.manager.save(bulletin);
    if (body.targets !== undefined) {
      await this.replaceTargets(bulletin.id, body.targets);
    }
    if (bulletin.status === 'published' && (body.targets !== undefined || body.manufacturer !== undefined)) {
      await this.matcher.matchBulletin(bulletin);
    }
    return this.view(bulletin, null);
  }

  async publish(actor: User, id: string): Promise<BulletinView> {
    this.assertAdmin(actor);
    const bulletin = await this.find(id);
    if (bulletin.status !== 'draft') {
      throw new ConflictException('Only a draft can be published');
    }
    bulletin.status = 'published';
    bulletin.publishedAt = new Date();
    await this.manager.save(bulletin);
    await this.matcher.matchBulletin(bulletin);
    return this.view(bulletin, null);
  }

  async withdraw(actor: User, id: string): Promise<BulletinView> {
    this.assertAdmin(actor);
    const bulletin = await this.find(id);
    if (bulletin.status !== 'published') {
      throw new ConflictException('Only a published bulletin can be withdrawn');
    }
    bulletin.status = 'withdrawn';
    await this.manager.save(bulletin);
    const matches = await this.manager.find(BulletinMatch, { where: { bulletinId: bulletin.id } });
    if (matches.length > 0) {
      const open = await this.manager.find(Grounding, {
        where: { bulletinMatchId: In(matches.map((m) => m.id)), closedAt: IsNull() },
      });
      for (const grounding of open) {
        grounding.closedBy = actor.id;
        grounding.closedAt = new Date();
        grounding.closeNote = 'The bulletin was withdrawn';
        await this.manager.save(grounding);
      }
    }
    return this.view(bulletin, null);
  }

  private assertAdmin(actor: User): void {
    if (actor.role !== Role.Admin) {
      throw new ForbiddenException('Only an admin manages bulletins');
    }
  }

  private async find(id: string): Promise<ServiceBulletin> {
    const bulletin = await this.manager.findOne(ServiceBulletin, { where: { id } });
    if (!bulletin) {
      throw new NotFoundException('Bulletin not found');
    }
    return bulletin;
  }

  private async replaceTargets(bulletinId: string, targets: BulletinTargetInput[]): Promise<void> {
    for (const old of await this.manager.find(BulletinTarget, { where: { bulletinId } })) {
      await this.manager.remove(old);
    }
    for (const target of targets) {
      await this.manager.save(
        this.manager.create(BulletinTarget, {
          bulletinId,
          model: blank(target.model),
          serialFrom: blank(target.serialFrom),
          serialTo: blank(target.serialTo),
          manufacturedFrom: blank(target.manufacturedFrom),
          manufacturedTo: blank(target.manufacturedTo),
        }),
      );
    }
  }

  private async view(bulletin: ServiceBulletin, scope: string[] | null): Promise<BulletinView> {
    const targets = await this.manager.find(BulletinTarget, { where: { bulletinId: bulletin.id } });
    let matches = await this.manager.find(BulletinMatch, { where: { bulletinId: bulletin.id } });
    if (scope !== null) {
      const items = scope.length === 0 ? [] : await this.manager.find(GearItem, { where: { ownerId: In(scope) } });
      const ids = new Set(items.map((i) => i.id));
      matches = matches.filter((m) => ids.has(m.gearItemId));
    }
    return {
      id: bulletin.id,
      manufacturer: bulletin.manufacturer,
      reference: bulletin.reference,
      title: bulletin.title,
      summary: bulletin.summary,
      requiredAction: bulletin.requiredAction,
      sourceUrl: bulletin.sourceUrl,
      issuedOn: bulletin.issuedOn,
      severity: bulletin.severity,
      status: bulletin.status,
      publishedAt: bulletin.publishedAt === null ? null : bulletin.publishedAt.toISOString(),
      targets: targets.map((t) => ({
        id: t.id,
        model: t.model,
        serialFrom: t.serialFrom,
        serialTo: t.serialTo,
        manufacturedFrom: t.manufacturedFrom,
        manufacturedTo: t.manufacturedTo,
      })),
      matchCounts: { open: matches.filter((m) => m.status === 'open').length, total: matches.length },
    };
  }
}
