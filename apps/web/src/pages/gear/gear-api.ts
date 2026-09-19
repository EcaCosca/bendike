import type {
  ComponentPartView,
  CreateGearItemRequestBody,
  CreateGearModelRequestBody,
  CreateMaintenanceEntryRequestBody,
  CreatePartRequestBody,
  CreateRigRequestBody,
  GearItemDetailView,
  GearItemView,
  GearModelView,
  GearOverview,
  MaintenanceEntryView,
  RigDetailView,
  RigView,
  UpdateGearItemRequestBody,
  UpdateGearModelRequestBody,
  UpdatePartRequestBody,
  UpdateRigRequestBody,
} from '@bendike/shared';
import { apiFetch } from '../../api/http';

function send<T>(method: string, path: string, token: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, token);
}

export function getOverview(token: string, ownerId?: string): Promise<GearOverview> {
  return apiFetch<GearOverview>(`/gear${ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : ''}`, {}, token);
}

export function getRig(token: string, id: string): Promise<RigDetailView> {
  return apiFetch<RigDetailView>(`/gear/rigs/${id}`, {}, token);
}

export function getItem(token: string, id: string): Promise<GearItemDetailView> {
  return apiFetch<GearItemDetailView>(`/gear/items/${id}`, {}, token);
}

export function createRig(token: string, body: CreateRigRequestBody): Promise<RigView> {
  return send('POST', '/gear/rigs', token, body);
}

export function updateRig(token: string, id: string, body: UpdateRigRequestBody): Promise<RigView> {
  return send('PATCH', `/gear/rigs/${id}`, token, body);
}

export function createItem(token: string, body: CreateGearItemRequestBody): Promise<GearItemView> {
  return send('POST', '/gear/items', token, body);
}

export function updateItem(token: string, id: string, body: UpdateGearItemRequestBody): Promise<GearItemView> {
  return send('PATCH', `/gear/items/${id}`, token, body);
}

export function addPart(token: string, itemId: string, body: CreatePartRequestBody): Promise<ComponentPartView> {
  return send('POST', `/gear/items/${itemId}/parts`, token, body);
}

export function updatePart(token: string, id: string, body: UpdatePartRequestBody): Promise<ComponentPartView> {
  return send('PATCH', `/gear/parts/${id}`, token, body);
}

export async function deletePart(token: string, id: string): Promise<void> {
  await send<void>('DELETE', `/gear/parts/${id}`, token);
}

export function addEntry(
  token: string,
  itemId: string,
  body: CreateMaintenanceEntryRequestBody,
): Promise<MaintenanceEntryView> {
  return send('POST', `/gear/items/${itemId}/maintenance`, token, body);
}

export function voidEntry(token: string, id: string, reason: string): Promise<MaintenanceEntryView> {
  return send('POST', `/gear/maintenance/${id}/void`, token, { reason });
}

export function verifyEntry(token: string, id: string): Promise<MaintenanceEntryView> {
  return send('POST', `/gear/maintenance/${id}/verify`, token);
}

export function listModels(token: string, includeInactive = false): Promise<GearModelView[]> {
  return apiFetch<GearModelView[]>(`/gear/models${includeInactive ? '?all=true' : ''}`, {}, token);
}

export function createModel(token: string, body: CreateGearModelRequestBody): Promise<GearModelView> {
  return send('POST', '/gear/models', token, body);
}

export function updateModel(token: string, id: string, body: UpdateGearModelRequestBody): Promise<GearModelView> {
  return send('PATCH', `/gear/models/${id}`, token, body);
}
