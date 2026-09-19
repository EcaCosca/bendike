import type {
  BulletinMatchView,
  BulletinView,
  CloseGroundingRequestBody,
  CreateBulletinRequestBody,
  GroundingView,
  MatchStatus,
  OpenGroundingRequestBody,
  ResolveMatchRequestBody,
  UpdateBulletinRequestBody,
} from '@bendike/shared';
import { apiFetch } from '../../api/http';

function post<T>(path: string, token: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, token);
}

export function listBulletins(token: string): Promise<BulletinView[]> {
  return apiFetch<BulletinView[]>('/bulletins', {}, token);
}

export function createBulletin(token: string, body: CreateBulletinRequestBody): Promise<BulletinView> {
  return post('/bulletins', token, body);
}

export function updateBulletin(token: string, id: string, body: UpdateBulletinRequestBody): Promise<BulletinView> {
  return apiFetch<BulletinView>(`/bulletins/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, token);
}

export function publishBulletin(token: string, id: string): Promise<BulletinView> {
  return post(`/bulletins/${id}/publish`, token);
}

export function withdrawBulletin(token: string, id: string): Promise<BulletinView> {
  return post(`/bulletins/${id}/withdraw`, token);
}

export function listMatches(token: string, status?: MatchStatus): Promise<BulletinMatchView[]> {
  return apiFetch<BulletinMatchView[]>(`/bulletins/matches${status ? `?status=${status}` : ''}`, {}, token);
}

export function resolveMatch(token: string, id: string, body: ResolveMatchRequestBody): Promise<BulletinMatchView> {
  return post(`/bulletins/matches/${id}/resolve`, token, body);
}

export function openGrounding(token: string, body: OpenGroundingRequestBody): Promise<GroundingView> {
  return post('/groundings', token, body);
}

export function closeGrounding(token: string, id: string, body: CloseGroundingRequestBody): Promise<GroundingView> {
  return post(`/groundings/${id}/close`, token, body);
}
