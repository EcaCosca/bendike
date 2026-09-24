import type { LearnItemSummary, LearnQuery, Locale, Page } from '@bendike/shared';
import { LEARN_MAX_PAGE_SIZE, LEARN_PAGE_SIZE, pickLocalized } from '@bendike/shared';

function normalise(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function matchesText(item: LearnItemSummary, term: string): boolean {
  const haystack = [
    item.title.en,
    item.title.es,
    item.title.pt,
    item.summary.en,
    item.summary.es,
    item.summary.pt,
    item.author ?? '',
    item.sourceName,
  ]
    .map(normalise)
    .join('\n');
  return normalise(term)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function filterLearnItems(items: LearnItemSummary[], query: LearnQuery): LearnItemSummary[] {
  return items.filter(
    (item) =>
      (!query.topic || item.topics.includes(query.topic)) &&
      (!query.type || item.format === query.type) &&
      (!query.level || item.level === query.level || item.level === 'all') &&
      (!query.lang || item.contentLanguage === query.lang) &&
      (!query.q?.trim() || matchesText(item, query.q)),
  );
}

export function sortLearnItems(items: LearnItemSummary[], query: LearnQuery): LearnItemSummary[] {
  const locale: Locale = query.locale ?? 'en';
  const sorted = [...items];
  if (query.sort === 'title') {
    sorted.sort((a, b) => pickLocalized(a.title, locale).localeCompare(pickLocalized(b.title, locale), locale));
  } else {
    sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.position - b.position);
  }
  return sorted;
}

export function pageLearnItems(items: LearnItemSummary[], query: LearnQuery): Page<LearnItemSummary> {
  const page = query.page && query.page >= 1 ? query.page : 1;
  const pageSize = Math.min(
    query.pageSize && query.pageSize >= 1 ? query.pageSize : LEARN_PAGE_SIZE,
    LEARN_MAX_PAGE_SIZE,
  );
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length };
}

export function searchLearnItems(items: LearnItemSummary[], query: LearnQuery): Page<LearnItemSummary> {
  return pageLearnItems(sortLearnItems(filterLearnItems(items, query), query), query);
}
