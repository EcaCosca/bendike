import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { matchGearToBulletin, type MatchConfidence } from '@bendike/shared';
import { In, IsNull, type EntityManager } from 'typeorm';
import { GearItem } from '../gear/entities/gear-item.entity';
import { Rig } from '../gear/entities/rig.entity';
import { BulletinMatch, BulletinTarget, Grounding, ServiceBulletin } from './entities';

export interface MatchResult {
  matched: number;
  groundings: number;
}

@Injectable()
export class BulletinMatcher {
  constructor(@InjectEntityManager() private readonly manager: EntityManager) {}

  async matchBulletin(bulletin: ServiceBulletin): Promise<MatchResult> {
    const targets = await this.manager.find(BulletinTarget, { where: { bulletinId: bulletin.id } });
    const items = await this.manager.find(GearItem, { where: { retiredAt: IsNull() } });
    return this.apply([{ bulletin, targets }], items);
  }

  async rematchItem(itemId: string): Promise<MatchResult> {
    const item = await this.manager.findOne(GearItem, { where: { id: itemId } });
    if (!item || item.retiredAt !== null) {
      return { matched: 0, groundings: 0 };
    }
    const bulletins = await this.manager.find(ServiceBulletin, { where: { status: 'published' } });
    if (bulletins.length === 0) {
      return { matched: 0, groundings: 0 };
    }
    const targets = await this.manager.find(BulletinTarget, { where: { bulletinId: In(bulletins.map((b) => b.id)) } });
    return this.apply(
      bulletins.map((bulletin) => ({ bulletin, targets: targets.filter((t) => t.bulletinId === bulletin.id) })),
      [item],
    );
  }

  private async apply(
    published: { bulletin: ServiceBulletin; targets: BulletinTarget[] }[],
    items: GearItem[],
  ): Promise<MatchResult> {
    const result: MatchResult = { matched: 0, groundings: 0 };
    for (const { bulletin, targets } of published) {
      const existing = await this.manager.find(BulletinMatch, { where: { bulletinId: bulletin.id } });
      const known = new Set(existing.map((m) => m.gearItemId));
      for (const item of items) {
        if (known.has(item.id)) continue;
        const confidence = matchGearToBulletin(
          { manufacturer: bulletin.manufacturer, targets },
          {
            manufacturer: item.manufacturer,
            model: item.model,
            serial: item.serial,
            manufacturedOn: item.manufacturedOn,
          },
        );
        if (confidence === null) continue;
        const match = await this.createMatch(bulletin, item, confidence);
        result.matched += 1;
        if (bulletin.severity === 'grounding') {
          await this.ground(bulletin, item, match);
          result.groundings += 1;
        }
      }
    }
    return result;
  }

  private createMatch(bulletin: ServiceBulletin, item: GearItem, confidence: MatchConfidence): Promise<BulletinMatch> {
    return this.manager.save(
      this.manager.create(BulletinMatch, {
        bulletinId: bulletin.id,
        gearItemId: item.id,
        confidence,
        status: 'open',
        resolutionNote: null,
        resolvedBy: null,
        resolvedAt: null,
      }),
    );
  }

  private async ground(bulletin: ServiceBulletin, item: GearItem, match: BulletinMatch): Promise<void> {
    const rig = item.rigId ? await this.manager.findOne(Rig, { where: { id: item.rigId } }) : null;
    await this.manager.save(
      this.manager.create(Grounding, {
        rigId: rig?.id ?? null,
        gearItemId: rig ? null : item.id,
        reason: `Bulletin ${bulletin.reference} (${bulletin.manufacturer}): ${bulletin.title}`,
        source: 'bulletin',
        bulletinMatchId: match.id,
        openedBy: bulletin.createdBy,
        openedAt: new Date(),
        closedBy: null,
        closedAt: null,
        closeNote: null,
      }),
    );
  }
}
