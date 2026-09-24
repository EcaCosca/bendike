import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import type {
  LearnCollectionSummary,
  LearnItemAdminDetail,
  LearnLink,
  LocalizedText,
  TranslationOverrides,
} from '@bendike/shared';
import { parseEmbed, youtubeThumbnail } from '@bendike/shared';
import { In, type EntityManager } from 'typeorm';
import { Brand } from '../catalog/entities/brand.entity';
import { Product } from '../catalog/entities/product.entity';
import { GearModel } from '../gear/entities/gear-model.entity';
import { TranslationService } from '../translation/translation.service';
import { User } from '../users/user.entity';
import {
  CreateLearnCollectionDto,
  CreateLearnItemDto,
  ReplaceLearnLinksDto,
  UpdateLearnCollectionDto,
  UpdateLearnCopyDto,
  UpdateLearnItemDto,
} from './dto/learn.dto';
import { LearnCollection, LearnCollectionItem } from './entities/learn-collection.entity';
import { LearnItemLink } from './entities/learn-item-link.entity';
import { LearnItem } from './entities/learn-item.entity';
import { toLearnCollectionSummary, toLearnItemAdminDetail } from './learn-mapper';

const TARGET_ENTITIES = { product: Product, brand: Brand, gear_model: GearModel } as const;

@Injectable()
export class LearnAdminService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly translation: TranslationService,
  ) {}

  async findAll(): Promise<LearnItemAdminDetail[]> {
    const items = await this.manager.find(LearnItem, { order: { position: 'ASC', slug: 'ASC' } });
    const links = await this.manager.find(LearnItemLink, {});
    return items.map((item) =>
      toLearnItemAdminDetail(
        item,
        links.filter((link) => link.itemId === item.id),
      ),
    );
  }

  async create(actor: User, dto: CreateLearnItemDto): Promise<LearnItemAdminDetail> {
    if (await this.manager.findOne(LearnItem, { where: { slug: dto.slug } })) {
      throw new ConflictException(`A learn item with slug ${dto.slug} already exists`);
    }
    const embed = parseEmbed(dto.url);
    const item = this.manager.create(LearnItem, {
      slug: dto.slug,
      format: dto.format,
      title: await this.localize(dto.title),
      summary: await this.localize(dto.summary),
      translationOverrides: {},
      author: dto.author ?? null,
      sourceName: dto.sourceName,
      url: dto.url,
      embedProvider: embed?.provider ?? null,
      embedId: embed?.id ?? null,
      embedKind: embed?.kind ?? null,
      thumbnailUrl: dto.thumbnailUrl ?? (embed?.provider === 'youtube' ? youtubeThumbnail(embed.id) : null),
      contentLanguage: dto.contentLanguage,
      topics: dto.topics,
      level: dto.level,
      durationMinutes: dto.durationMinutes ?? null,
      publishedAt: dto.publishedAt ?? null,
      buyUrl: dto.buyUrl ?? null,
      affiliate: dto.affiliate ?? false,
      position: dto.position ?? 0,
      active: true,
      createdBy: actor.id,
    });
    return toLearnItemAdminDetail(await this.manager.save(item), []);
  }

  async update(id: string, dto: UpdateLearnItemDto): Promise<LearnItemAdminDetail> {
    const item = await this.itemOrThrow(id);
    if (dto.url !== undefined && dto.url !== item.url) {
      const embed = parseEmbed(dto.url);
      item.url = dto.url;
      item.embedProvider = embed?.provider ?? null;
      item.embedId = embed?.id ?? null;
      item.embedKind = embed?.kind ?? null;
      if (dto.thumbnailUrl === undefined) {
        item.thumbnailUrl = embed?.provider === 'youtube' ? youtubeThumbnail(embed.id) : item.thumbnailUrl;
      }
    }
    for (const key of ['format', 'sourceName', 'contentLanguage', 'topics', 'level', 'position', 'active'] as const) {
      const value = dto[key];
      if (value !== undefined) {
        Object.assign(item, { [key]: value });
      }
    }
    for (const key of ['author', 'thumbnailUrl', 'durationMinutes', 'publishedAt', 'buyUrl'] as const) {
      if (key in dto) {
        Object.assign(item, { [key]: dto[key] ?? null });
      }
    }
    if (dto.affiliate !== undefined) {
      item.affiliate = dto.affiliate;
    }
    const saved = await this.manager.save(item);
    return toLearnItemAdminDetail(saved, await this.linksOf(saved.id));
  }

  async updateCopy(id: string, dto: UpdateLearnCopyDto): Promise<LearnItemAdminDetail> {
    const item = await this.itemOrThrow(id);
    item[dto.field] = { ...item[dto.field], [dto.locale]: dto.value };
    const overrides: TranslationOverrides = { ...item.translationOverrides };
    overrides[dto.locale] = [...new Set([...(overrides[dto.locale] ?? []), dto.field])];
    item.translationOverrides = overrides;
    const saved = await this.manager.save(item);
    return toLearnItemAdminDetail(saved, await this.linksOf(saved.id));
  }

  async replaceLinks(id: string, dto: ReplaceLearnLinksDto): Promise<LearnItemAdminDetail> {
    const item = await this.itemOrThrow(id);
    await this.assertTargetsExist(dto.links);
    for (const existing of await this.linksOf(item.id)) {
      await this.manager.remove(existing);
    }
    const seen = new Set<string>();
    let position = 0;
    for (const link of dto.links) {
      const key = `${link.kind}:${link.targetId}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      await this.manager.save(
        this.manager.create(LearnItemLink, {
          itemId: item.id,
          targetKind: link.kind,
          targetId: link.targetId,
          position,
        }),
      );
      position += 1;
    }
    return toLearnItemAdminDetail(item, await this.linksOf(item.id));
  }

  async findAllCollections(): Promise<LearnCollectionSummary[]> {
    const collections = await this.manager.find(LearnCollection, { order: { slug: 'ASC' } });
    const members = await this.manager.find(LearnCollectionItem, {});
    return collections.map((collection) =>
      toLearnCollectionSummary(
        collection,
        members.filter((member) => member.collectionId === collection.id),
      ),
    );
  }

  async createCollection(dto: CreateLearnCollectionDto): Promise<LearnCollectionSummary> {
    if (await this.manager.findOne(LearnCollection, { where: { slug: dto.slug } })) {
      throw new ConflictException(`A collection with slug ${dto.slug} already exists`);
    }
    if (dto.startHere) {
      await this.assertNoOtherStartHere(dto.topic, null);
    }
    await this.assertItemsExist(dto.itemIds);
    const collection = await this.manager.save(
      this.manager.create(LearnCollection, {
        slug: dto.slug,
        title: await this.localize(dto.title),
        intro: await this.localize(dto.intro),
        topic: dto.topic,
        startHere: dto.startHere ?? false,
        active: true,
      }),
    );
    const members = await this.replaceMembers(collection.id, dto.itemIds);
    return toLearnCollectionSummary(collection, members);
  }

  async updateCollection(id: string, dto: UpdateLearnCollectionDto): Promise<LearnCollectionSummary> {
    const collection = await this.manager.findOne(LearnCollection, { where: { id } });
    if (!collection) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    const topic = dto.topic ?? collection.topic;
    const startHere = dto.startHere ?? collection.startHere;
    if (startHere && (topic !== collection.topic || !collection.startHere)) {
      await this.assertNoOtherStartHere(topic, collection.id);
    }
    collection.topic = topic;
    collection.startHere = startHere;
    if (dto.active !== undefined) {
      collection.active = dto.active;
    }
    const saved = await this.manager.save(collection);
    let members = await this.manager.find(LearnCollectionItem, { where: { collectionId: saved.id } });
    if (dto.itemIds !== undefined) {
      await this.assertItemsExist(dto.itemIds);
      members = await this.replaceMembers(saved.id, dto.itemIds);
    }
    return toLearnCollectionSummary(saved, members);
  }

  private async localize(english: string): Promise<LocalizedText> {
    const translated = await this.translation.translateField(english);
    return { en: english, es: translated.es ?? english, pt: translated.pt ?? english };
  }

  private async itemOrThrow(id: string): Promise<LearnItem> {
    const item = await this.manager.findOne(LearnItem, { where: { id } });
    if (!item) {
      throw new NotFoundException(`Learn item ${id} not found`);
    }
    return item;
  }

  private linksOf(itemId: string): Promise<LearnItemLink[]> {
    return this.manager.find(LearnItemLink, { where: { itemId }, order: { position: 'ASC' } });
  }

  private async assertTargetsExist(links: LearnLink[]): Promise<void> {
    for (const link of links) {
      const target = await this.manager.findOne(TARGET_ENTITIES[link.kind], { where: { id: link.targetId } });
      if (!target) {
        throw new BadRequestException(`No ${link.kind.replace('_', ' ')} with id ${link.targetId}`);
      }
    }
  }

  private async assertItemsExist(itemIds: string[]): Promise<void> {
    if (itemIds.length === 0) {
      return;
    }
    const found = await this.manager.find(LearnItem, { where: { id: In(itemIds) } });
    const missing = itemIds.filter((id) => !found.some((item) => item.id === id));
    if (missing.length > 0) {
      throw new BadRequestException(`No learn item with id ${missing.join(', ')}`);
    }
  }

  private async assertNoOtherStartHere(topic: LearnCollection['topic'], exceptId: string | null): Promise<void> {
    const existing = await this.manager.findOne(LearnCollection, { where: { topic, startHere: true } });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(`${existing.slug} is already the start-here collection for ${topic}`);
    }
  }

  private async replaceMembers(collectionId: string, itemIds: string[]): Promise<LearnCollectionItem[]> {
    for (const existing of await this.manager.find(LearnCollectionItem, { where: { collectionId } })) {
      await this.manager.remove(existing);
    }
    const members: LearnCollectionItem[] = [];
    for (const [position, itemId] of itemIds.entries()) {
      members.push(
        await this.manager.save(this.manager.create(LearnCollectionItem, { collectionId, itemId, position })),
      );
    }
    return members;
  }
}
