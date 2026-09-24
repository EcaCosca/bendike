import type {
  CreateLearnCollectionRequestBody,
  CreateLearnItemRequestBody,
  LearnCollectionSummary,
  LearnItemAdminDetail,
  ReplaceLearnLinksRequestBody,
  UpdateLearnCollectionRequestBody,
  UpdateLearnCopyRequestBody,
  UpdateLearnItemRequestBody,
} from '@bendike/shared';
import { apiFetch } from '../../api/http';

function send<T>(method: string, path: string, token: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, token);
}

export function listAllLearnItems(token: string): Promise<LearnItemAdminDetail[]> {
  return apiFetch<LearnItemAdminDetail[]>('/admin/learn/items', {}, token);
}

export function createLearnItem(token: string, body: CreateLearnItemRequestBody): Promise<LearnItemAdminDetail> {
  return send('POST', '/admin/learn/items', token, body);
}

export function updateLearnItem(
  token: string,
  id: string,
  body: UpdateLearnItemRequestBody,
): Promise<LearnItemAdminDetail> {
  return send('PATCH', `/admin/learn/items/${id}`, token, body);
}

export function updateLearnCopy(
  token: string,
  id: string,
  body: UpdateLearnCopyRequestBody,
): Promise<LearnItemAdminDetail> {
  return send('PATCH', `/admin/learn/items/${id}/copy`, token, body);
}

export function replaceLearnLinks(
  token: string,
  id: string,
  body: ReplaceLearnLinksRequestBody,
): Promise<LearnItemAdminDetail> {
  return send('PUT', `/admin/learn/items/${id}/links`, token, body);
}

export function listAllLearnCollections(token: string): Promise<LearnCollectionSummary[]> {
  return apiFetch<LearnCollectionSummary[]>('/admin/learn/collections', {}, token);
}

export function createLearnCollection(
  token: string,
  body: CreateLearnCollectionRequestBody,
): Promise<LearnCollectionSummary> {
  return send('POST', '/admin/learn/collections', token, body);
}

export function updateLearnCollection(
  token: string,
  id: string,
  body: UpdateLearnCollectionRequestBody,
): Promise<LearnCollectionSummary> {
  return send('PATCH', `/admin/learn/collections/${id}`, token, body);
}
