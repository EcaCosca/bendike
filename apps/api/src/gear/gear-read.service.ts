import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import type {
  GearItemDetailView,
  GearItemView,
  GearOverview,
  GroundingView,
  OpenBulletinNotice,
  RigDetailView,
  RigView,
  RiggerName,
} from '@bendike/shared';
import { In, IsNull, type EntityManager } from 'typeorm';
import { BulletinMatch, Grounding, ServiceBulletin } from '../bulletins/entities';
import { toGroundingView } from '../bulletins/views';
import { RiggerLinksService } from '../rigger-links/rigger-links.service';
import { User } from '../users/user.entity';
import { ComponentPart } from './entities/component-part.entity';
import { AadDetail, ContainerDetail, MainDetail, ReserveDetail } from './entities/details.entities';
import { GearItem } from './entities/gear-item.entity';
import { GearModel } from './entities/gear-model.entity';
import { MaintenanceEntry } from './entities/maintenance-entry.entity';
import { Rig } from './entities/rig.entity';
import { GearAccessService } from './gear-access.service';
import { GearClock } from './gear-clock';
import { buildGearItemView, buildOverview, buildRigView, toEntryView, type DetailRow } from './gear-views';

function newestFirst(a: MaintenanceEntry, b: MaintenanceEntry): number {
  return b.performedOn.localeCompare(a.performedOn) || b.createdAt.getTime() - a.createdAt.getTime();
}

export interface ActiveRiggersLookup {
  activeRiggers(ownerId: string): Promise<RiggerName[]>;
}

interface Loaded {
  views: GearItemView[];
  entries: MaintenanceEntry[];
  groundings: GroundingView[];
}

const EMPTY: Loaded = { views: [], entries: [], groundings: [] };

@Injectable()
export class GearReadService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly access: GearAccessService,
    private readonly clock: GearClock,
    @Inject(RiggerLinksService) private readonly links: ActiveRiggersLookup,
  ) {}

  async overview(actor: User, ownerId: string = actor.id): Promise<GearOverview> {
    await this.access.assertRead(actor, ownerId);
    const rigs = await this.manager.find(Rig, { where: { ownerId } });
    const items = await this.manager.find(GearItem, { where: { ownerId, retiredAt: IsNull() } });
    const { views, entries, groundings } = await this.loadViews(
      items,
      rigs.map((r) => r.id),
    );
    const riggers = await this.links.activeRiggers(ownerId);
    rigs.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }));
    return buildOverview(
      rigs.map((rig) => {
        const rigItems = views.filter((v) => v.rigId === rig.id);
        const ids = new Set(rigItems.map((v) => v.id));
        return {
          rig,
          items: rigItems,
          entries: entries.filter((e) => ids.has(e.gearItemId)),
          riggers,
          groundings: this.openFor(groundings, rig.id, ids),
        };
      }),
      views.filter((v) => v.rigId === null),
    );
  }

  async rigDetail(actor: User, rigId: string): Promise<RigDetailView> {
    const rig = await this.manager.findOne(Rig, { where: { id: rigId } });
    if (!rig) {
      throw new NotFoundException('Rig not found');
    }
    await this.access.assertRead(actor, rig.ownerId);
    return this.detailOf(rig);
  }

  async rigView(rig: Rig): Promise<RigView> {
    const { view } = await this.loadRig(rig);
    return view;
  }

  async itemView(itemId: string): Promise<GearItemView> {
    const item = await this.manager.findOne(GearItem, { where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Gear item not found');
    }
    const { views } = await this.loadViews([item], []);
    return views[0] as GearItemView;
  }

  async itemDetail(actor: User, itemId: string): Promise<GearItemDetailView> {
    const item = await this.manager.findOne(GearItem, { where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Gear item not found');
    }
    await this.access.assertRead(actor, item.ownerId);
    const { views, entries } = await this.loadViews([item], []);
    return { ...(views[0] as GearItemView), entries: entries.sort(newestFirst).map(toEntryView) };
  }

  async detailOf(rig: Rig): Promise<RigDetailView> {
    const { view, entries, history } = await this.loadRig(rig);
    return { ...view, entries: entries.sort(newestFirst).map(toEntryView), groundingHistory: history };
  }

  async viewsForItems(items: GearItem[]): Promise<GearItemView[]> {
    return (await this.loadViews(items, [])).views;
  }

  private async loadRig(rig: Rig): Promise<{ view: RigView; entries: MaintenanceEntry[]; history: GroundingView[] }> {
    const items = await this.manager.find(GearItem, { where: { rigId: rig.id, retiredAt: IsNull() } });
    const { views, entries, groundings } = await this.loadViews(items, [rig.id]);
    const ids = new Set(views.map((v) => v.id));
    const riggers = await this.links.activeRiggers(rig.ownerId);
    const view = buildRigView(rig, views, entries, riggers, this.openFor(groundings, rig.id, ids));
    const history = groundings
      .filter((g) => g.rigId === rig.id || (g.gearItemId !== null && ids.has(g.gearItemId)))
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
    return { view, entries, history };
  }

  private openFor(groundings: GroundingView[], rigId: string, itemIds: Set<string>): GroundingView[] {
    return groundings.filter(
      (g) => g.closedAt === null && (g.rigId === rigId || (g.gearItemId !== null && itemIds.has(g.gearItemId))),
    );
  }

  private async loadViews(items: GearItem[], rigIds: string[]): Promise<Loaded> {
    if (items.length === 0 && rigIds.length === 0) {
      return EMPTY;
    }
    const ids = items.map((i) => i.id);
    const modelIds = [...new Set(items.map((i) => i.modelId).filter((m): m is string => m !== null))];
    const groundingWhere = [
      ...(rigIds.length > 0 ? [{ rigId: In(rigIds) }] : []),
      ...(ids.length > 0 ? [{ gearItemId: In(ids) }] : []),
    ];
    const [containers, mains, reserves, aads, parts, models, entries, groundingRows, matches] = await Promise.all([
      this.byItem(ContainerDetail, ids),
      this.byItem(MainDetail, ids),
      this.byItem(ReserveDetail, ids),
      this.byItem(AadDetail, ids),
      this.byItem(ComponentPart, ids),
      modelIds.length === 0
        ? Promise.resolve([] as GearModel[])
        : this.manager.find(GearModel, { where: { id: In(modelIds) } }),
      this.byItem(MaintenanceEntry, ids),
      groundingWhere.length === 0
        ? Promise.resolve([] as Grounding[])
        : this.manager.find(Grounding, { where: groundingWhere }),
      ids.length === 0
        ? Promise.resolve([] as BulletinMatch[])
        : this.manager.find(BulletinMatch, { where: { gearItemId: In(ids), status: 'open' } }),
    ]);
    const groundings = await this.groundingViews(groundingRows);
    const notices = await this.noticesFor(matches);
    const details = new Map<string, DetailRow>();
    for (const row of [...containers, ...mains, ...reserves, ...aads]) {
      details.set(row.gearItemId, row);
    }
    const today = this.clock.today();
    const views = items.map((item) =>
      buildGearItemView(
        {
          item,
          detail: details.get(item.id) ?? null,
          parts: parts.filter((p) => p.gearItemId === item.id),
          model: models.find((m) => m.id === item.modelId) ?? null,
          entries: entries.filter((e) => e.gearItemId === item.id),
          bulletins: notices.get(item.id) ?? [],
          groundings: groundings.filter((g) => g.closedAt === null && g.gearItemId === item.id),
        },
        today,
      ),
    );
    return { views, entries, groundings };
  }

  private byItem<T extends { gearItemId: string }>(entity: new () => T, ids: string[]): Promise<T[]> {
    return ids.length === 0
      ? Promise.resolve([])
      : this.manager.find(entity, { where: { gearItemId: In(ids) } as never });
  }

  private async groundingViews(rows: Grounding[]): Promise<GroundingView[]> {
    if (rows.length === 0) {
      return [];
    }
    const userIds = [
      ...new Set(rows.flatMap((g) => [g.openedBy, g.closedBy]).filter((id): id is string => id !== null)),
    ];
    const users = await this.manager.find(User, { where: { id: In(userIds) } });
    const names = new Map(users.map((u) => [u.id, u.displayName]));
    return rows.map((g) => toGroundingView(g, names));
  }

  private async noticesFor(matches: BulletinMatch[]): Promise<Map<string, OpenBulletinNotice[]>> {
    const notices = new Map<string, OpenBulletinNotice[]>();
    if (matches.length === 0) {
      return notices;
    }
    const bulletins = await this.manager.find(ServiceBulletin, {
      where: { id: In([...new Set(matches.map((m) => m.bulletinId))]), status: 'published' },
    });
    for (const match of matches) {
      const bulletin = bulletins.find((b) => b.id === match.bulletinId);
      if (!bulletin) continue;
      const list = notices.get(match.gearItemId) ?? [];
      list.push({
        matchId: match.id,
        bulletinId: bulletin.id,
        reference: bulletin.reference,
        title: bulletin.title,
        severity: bulletin.severity,
        confidence: match.confidence,
      });
      notices.set(match.gearItemId, list);
    }
    return notices;
  }
}
