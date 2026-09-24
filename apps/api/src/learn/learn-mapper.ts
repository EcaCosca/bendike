import type {
  LearnCollectionDetail,
  LearnCollectionSummary,
  LearnItemAdminDetail,
  LearnItemDetail,
  LearnItemSummary,
  LearnLink,
} from '@bendike/shared';
import type { LearnCollection, LearnCollectionItem } from './entities/learn-collection.entity';
import type { LearnItemLink } from './entities/learn-item-link.entity';
import type { LearnItem } from './entities/learn-item.entity';

export function toLearnItemSummary(item: LearnItem): LearnItemSummary {
  return {
    id: item.id,
    slug: item.slug,
    format: item.format,
    title: item.title,
    summary: item.summary,
    author: item.author,
    sourceName: item.sourceName,
    url: item.url,
    embed:
      item.embedProvider && item.embedId && item.embedKind
        ? { provider: item.embedProvider, id: item.embedId, kind: item.embedKind }
        : null,
    thumbnailUrl: item.thumbnailUrl,
    contentLanguage: item.contentLanguage,
    topics: item.topics,
    level: item.level,
    durationMinutes: item.durationMinutes,
    publishedAt: item.publishedAt,
    buyUrl: item.buyUrl,
    affiliate: item.affiliate,
    position: item.position,
    active: item.active,
    createdAt: item.createdAt.toISOString(),
  };
}

export function toLearnLink(link: LearnItemLink): LearnLink {
  return { kind: link.targetKind, targetId: link.targetId };
}

export function toLearnItemDetail(item: LearnItem, links: LearnItemLink[]): LearnItemDetail {
  return { ...toLearnItemSummary(item), links: links.map(toLearnLink) };
}

export function toLearnItemAdminDetail(item: LearnItem, links: LearnItemLink[]): LearnItemAdminDetail {
  return { ...toLearnItemDetail(item, links), translationOverrides: item.translationOverrides };
}

export function toLearnCollectionSummary(
  collection: LearnCollection,
  members: LearnCollectionItem[],
): LearnCollectionSummary {
  return {
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    intro: collection.intro,
    topic: collection.topic,
    startHere: collection.startHere,
    active: collection.active,
    itemIds: [...members].sort((a, b) => a.position - b.position).map((member) => member.itemId),
  };
}

export function toLearnCollectionDetail(
  collection: LearnCollection,
  members: LearnCollectionItem[],
  items: LearnItemSummary[],
): LearnCollectionDetail {
  const summary = toLearnCollectionSummary(collection, members);
  const byId = new Map(items.map((item) => [item.id, item]));
  return {
    ...summary,
    items: summary.itemIds.flatMap((id) => {
      const item = byId.get(id);
      return item ? [item] : [];
    }),
  };
}
