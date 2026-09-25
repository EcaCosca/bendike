import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import type {
  LearnCollectionDetail,
  LearnItemDetail,
  LearnItemSummary,
  LearnLinkKind,
  LearnQuery,
  LearnRigSection,
  LearnTopic,
  Page,
} from '@bendike/shared';
import { In, IsNull, Not, type EntityManager } from 'typeorm';
import { Product } from '../catalog/entities/product.entity';
import { GearItem } from '../gear/entities/gear-item.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearAccessService } from '../gear/gear-access.service';
import { User } from '../users/user.entity';
import { LearnCollection, LearnCollectionItem } from './entities/learn-collection.entity';
import { LearnItemLink } from './entities/learn-item-link.entity';
import { LearnItem } from './entities/learn-item.entity';
import { searchLearnItems } from './learn-filter';
import { toLearnCollectionDetail, toLearnItemDetail, toLearnItemSummary } from './learn-mapper';

export const RELATED_LIMIT = 6;

function byCuratedOrder(a: LearnItem, b: LearnItem): number {
  return a.position - b.position || b.createdAt.getTime() - a.createdAt.getTime();
}

@Injectable()
export class LearnService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly access: GearAccessService,
  ) {}

  async search(query: LearnQuery): Promise<Page<LearnItemSummary>> {
    const items = await this.manager.find(LearnItem, { where: { active: true, format: Not('film') } });
    return searchLearnItems(items.map(toLearnItemSummary), query);
  }

  /** Films for the landing carousel. Deliberately the one place they are served. */
  async films(): Promise<LearnItemSummary[]> {
    const items = await this.manager.find(LearnItem, { where: { active: true, format: 'film' } });
    return items.sort(byCuratedOrder).map(toLearnItemSummary);
  }

  async findBySlug(slug: string): Promise<LearnItemDetail> {
    const item = await this.manager.findOne(LearnItem, { where: { slug, active: true } });
    if (!item) {
      throw new NotFoundException(`Learn item ${slug} not found`);
    }
    const links = await this.manager.find(LearnItemLink, { where: { itemId: item.id }, order: { position: 'ASC' } });
    return toLearnItemDetail(item, links);
  }

  async related(slug: string): Promise<LearnItemSummary[]> {
    const item = await this.manager.findOne(LearnItem, { where: { slug, active: true } });
    if (!item) {
      throw new NotFoundException(`Learn item ${slug} not found`);
    }
    const candidates = await this.manager.find(LearnItem, { where: { active: true, format: Not('film') } });
    return candidates
      .filter((other) => other.id !== item.id && other.topics.some((topic) => item.topics.includes(topic)))
      .sort(byCuratedOrder)
      .slice(0, RELATED_LIMIT)
      .map(toLearnItemSummary);
  }

  async forProduct(productId: string): Promise<LearnItemSummary[]> {
    const own = await this.linked('product', [productId]);
    if (own.length > 0) {
      return own;
    }
    const product = await this.manager.findOne(Product, { where: { id: productId } });
    return product ? this.linked('brand', [product.brandId]) : [];
  }

  async forRig(actor: User, rigId: string): Promise<LearnRigSection[]> {
    const rig = await this.manager.findOne(Rig, { where: { id: rigId } });
    if (!rig) {
      throw new NotFoundException('Gear not found');
    }
    await this.access.assertRead(actor, rig.ownerId);
    const components = await this.manager.find(GearItem, { where: { rigId, retiredAt: IsNull() } });
    const sections: LearnRigSection[] = [];
    for (const component of components) {
      const items = component.modelId ? await this.linked('gear_model', [component.modelId]) : [];
      if (items.length > 0) {
        sections.push({
          gearItemId: component.id,
          label: `${component.manufacturer} ${component.model}`,
          items,
        });
      }
    }
    return sections;
  }

  async forGearItem(actor: User, gearItemId: string): Promise<LearnItemSummary[]> {
    const component = await this.manager.findOne(GearItem, { where: { id: gearItemId } });
    if (!component) {
      throw new NotFoundException('Gear not found');
    }
    await this.access.assertRead(actor, component.ownerId);
    return component.modelId ? this.linked('gear_model', [component.modelId]) : [];
  }

  async collections(topic?: LearnTopic): Promise<LearnCollectionDetail[]> {
    const where = topic ? { active: true, topic } : { active: true };
    const collections = await this.manager.find(LearnCollection, { where, order: { slug: 'ASC' } });
    const details = await Promise.all(collections.map((collection) => this.collectionDetail(collection)));
    return details.sort((a, b) => Number(b.startHere) - Number(a.startHere));
  }

  async collectionBySlug(slug: string): Promise<LearnCollectionDetail> {
    const collection = await this.manager.findOne(LearnCollection, { where: { slug, active: true } });
    if (!collection) {
      throw new NotFoundException(`Collection ${slug} not found`);
    }
    return this.collectionDetail(collection);
  }

  private async collectionDetail(collection: LearnCollection): Promise<LearnCollectionDetail> {
    const members = await this.manager.find(LearnCollectionItem, { where: { collectionId: collection.id } });
    const ids = members.map((member) => member.itemId);
    const items = ids.length === 0 ? [] : await this.manager.find(LearnItem, { where: { id: In(ids), active: true } });
    return toLearnCollectionDetail(collection, members, items.map(toLearnItemSummary));
  }

  private async linked(kind: LearnLinkKind, targetIds: string[]): Promise<LearnItemSummary[]> {
    if (targetIds.length === 0) {
      return [];
    }
    const links = await this.manager.find(LearnItemLink, { where: { targetKind: kind, targetId: In(targetIds) } });
    const ids = [...new Set(links.map((link) => link.itemId))];
    if (ids.length === 0) {
      return [];
    }
    const items = await this.manager.find(LearnItem, { where: { id: In(ids), active: true } });
    const linkPosition = new Map(links.map((link) => [link.itemId, link.position]));
    return items
      .sort((a, b) => (linkPosition.get(a.id) ?? 0) - (linkPosition.get(b.id) ?? 0) || byCuratedOrder(a, b))
      .map(toLearnItemSummary);
  }
}
