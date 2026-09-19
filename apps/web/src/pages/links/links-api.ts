import type { CreateRiggerLinkRequestBody, RiggerLinkView, RiggerSummary } from '@bendike/shared';
import { apiFetch } from '../../api/http';

export function listLinks(token: string): Promise<RiggerLinkView[]> {
  return apiFetch<RiggerLinkView[]>('/rigger-links', {}, token);
}

export function createLink(token: string, body: CreateRiggerLinkRequestBody): Promise<RiggerLinkView> {
  return apiFetch<RiggerLinkView>('/rigger-links', { method: 'POST', body: JSON.stringify(body) }, token);
}

function act(action: 'confirm' | 'decline' | 'end') {
  return (token: string, id: string): Promise<RiggerLinkView> =>
    apiFetch<RiggerLinkView>(`/rigger-links/${id}/${action}`, { method: 'POST' }, token);
}

export const confirmLink = act('confirm');
export const declineLink = act('decline');
export const endLink = act('end');

export function searchRiggers(token: string, search: string): Promise<RiggerSummary[]> {
  return apiFetch<RiggerSummary[]>(`/riggers?search=${encodeURIComponent(search)}`, {}, token);
}
