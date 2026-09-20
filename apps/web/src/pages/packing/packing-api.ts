import type {
  GearModelView,
  PackingJobView,
  PackingSheetSummary,
  PackingSheetView,
  SavePackingDraftRequestBody,
} from '@bendike/shared';
import { apiFetch } from '../../api/http';

function send<T>(method: string, path: string, token: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, token);
}

export function startSheet(token: string, rigId: string): Promise<PackingJobView> {
  return send('POST', '/packing-sheets', token, { rigId });
}

export function getSheet(token: string, sheetId: string): Promise<PackingJobView> {
  return apiFetch<PackingJobView>(`/packing-sheets/${sheetId}`, {}, token);
}

export function saveDraft(token: string, sheetId: string, body: SavePackingDraftRequestBody): Promise<PackingJobView> {
  return send('PUT', `/packing-sheets/${sheetId}`, token, body);
}

export function signSheet(token: string, sheetId: string, riggerLicence: string): Promise<PackingSheetView> {
  return send('POST', `/packing-sheets/${sheetId}/sign`, token, { riggerLicence });
}

export function voidSheet(token: string, sheetId: string, reason: string): Promise<PackingSheetView> {
  return send('POST', `/packing-sheets/${sheetId}/void`, token, { reason });
}

export function listSheets(
  token: string,
  scope: { rigId: string } | { reserveItemId: string },
): Promise<PackingSheetSummary[]> {
  const query = 'rigId' in scope ? `rigId=${scope.rigId}` : `reserveItemId=${scope.reserveItemId}`;
  return apiFetch<PackingSheetSummary[]>(`/packing-sheets?${query}`, {}, token);
}

export function setBulletinsLink(token: string, modelId: string, url: string): Promise<GearModelView> {
  return send('PUT', `/gear/models/${modelId}/bulletins-link`, token, { url });
}
