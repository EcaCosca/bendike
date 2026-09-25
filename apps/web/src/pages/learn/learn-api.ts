import type {
  LearnCollectionDetail,
  LearnItemDetail,
  LearnItemSummary,
  LearnQuery,
  LearnRigSection,
  LearnTopic,
  Page,
} from '@bendike/shared';
import { apiFetch } from '../../api/http';

export function toLearnQueryString(query: LearnQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const serialised = params.toString();
  return serialised ? `?${serialised}` : '';
}

export function listLearnItems(query: LearnQuery): Promise<Page<LearnItemSummary>> {
  return apiFetch<Page<LearnItemSummary>>(`/learn/items${toLearnQueryString(query)}`);
}

export function getLearnItem(slug: string): Promise<LearnItemDetail> {
  return apiFetch<LearnItemDetail>(`/learn/items/${encodeURIComponent(slug)}`);
}

export function listRelatedLearnItems(slug: string): Promise<LearnItemSummary[]> {
  return apiFetch<LearnItemSummary[]>(`/learn/items/${encodeURIComponent(slug)}/related`);
}

export function listLearnCollections(topic?: LearnTopic): Promise<LearnCollectionDetail[]> {
  return apiFetch<LearnCollectionDetail[]>(`/learn/collections${topic ? `?topic=${topic}` : ''}`);
}

export function listLearnForProduct(productId: string): Promise<LearnItemSummary[]> {
  return apiFetch<LearnItemSummary[]>(`/learn/for-product/${encodeURIComponent(productId)}`);
}

export function listLearnForRig(token: string, rigId: string): Promise<LearnRigSection[]> {
  return apiFetch<LearnRigSection[]>(`/learn/for-rig/${encodeURIComponent(rigId)}`, {}, token);
}

export function listLearnForGearItem(token: string, gearItemId: string): Promise<LearnItemSummary[]> {
  return apiFetch<LearnItemSummary[]>(`/learn/for-gear-item/${encodeURIComponent(gearItemId)}`, {}, token);
}

export function listFilms(): Promise<LearnItemSummary[]> {
  return apiFetch<LearnItemSummary[]>('/learn/films');
}
