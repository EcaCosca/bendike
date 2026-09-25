import type {
  ContentLanguage,
  LearnFormat,
  LearnLevel,
  LearnQuery,
  LearnSort,
  LearnTopic,
  Locale,
} from '@bendike/shared';
import {
  CONTENT_LANGUAGES,
  LEARN_BROWSABLE_FORMATS,
  LEARN_LEVELS,
  LEARN_PAGE_SIZE,
  LEARN_SORTS,
  LEARN_TOPICS,
} from '@bendike/shared';

export type LearnFilterKey = 'q' | 'topic' | 'type' | 'level' | 'lang' | 'sort';
export type LearnFilterPatch = Partial<Record<LearnFilterKey, string | undefined>>;

function parsePage(raw: string | null): number {
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function parseOneOf<T extends string>(raw: string | null, allowed: readonly T[]): T | undefined {
  return allowed.find((value) => value === raw);
}

export function parseLearnQuery(params: URLSearchParams, locale: Locale): LearnQuery {
  return {
    q: params.get('q')?.trim() || undefined,
    topic: parseOneOf<LearnTopic>(params.get('topic'), LEARN_TOPICS),
    // Not LEARN_FORMATS: ?type=film would be a filter the Learn page can never satisfy.
    type: parseOneOf<LearnFormat>(params.get('type'), LEARN_BROWSABLE_FORMATS),
    level: parseOneOf<LearnLevel>(params.get('level'), LEARN_LEVELS),
    lang: parseOneOf<ContentLanguage>(params.get('lang'), CONTENT_LANGUAGES),
    sort: parseOneOf<LearnSort>(params.get('sort'), LEARN_SORTS),
    page: parsePage(params.get('page')),
    pageSize: LEARN_PAGE_SIZE,
    locale,
  };
}

export function applyLearnPatch(params: URLSearchParams, patch: LearnFilterPatch): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(patch)) {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  }
  next.delete('page');
  return next;
}

export function hasActiveFilters(query: LearnQuery): boolean {
  return Boolean(query.q || query.topic || query.type || query.level || query.lang);
}
