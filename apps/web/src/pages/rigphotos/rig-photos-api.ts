import type { RigCovers, RigPhotoView } from '@bendike/shared';
import { API_BASE, ApiError, apiFetch } from '../../api/http';

export function listPhotos(token: string, rigId: string): Promise<RigPhotoView[]> {
  return apiFetch<RigPhotoView[]>(`/rig-photos?rigId=${rigId}`, {}, token);
}

export function getCovers(token: string, ownerId?: string): Promise<RigCovers> {
  return apiFetch<RigCovers>(`/rig-photos/covers${ownerId ? `?ownerId=${ownerId}` : ''}`, {}, token);
}

export function uploadPhoto(
  token: string,
  file: File,
  fields: { rigId: string; caption?: string; entryId?: string },
): Promise<RigPhotoView> {
  const form = new FormData();
  form.set('file', file);
  form.set('rigId', fields.rigId);
  if (fields.caption?.trim()) form.set('caption', fields.caption.trim());
  if (fields.entryId) form.set('entryId', fields.entryId);
  return apiFetch<RigPhotoView>('/rig-photos', { method: 'POST', body: form }, token);
}

export function removePhoto(token: string, photoId: string): Promise<void> {
  return apiFetch<void>(`/rig-photos/${photoId}`, { method: 'DELETE' }, token);
}

export async function fetchPhotoBlob(token: string, photoId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/rig-photos/${photoId}/file`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new ApiError(response.status, 'Could not load the photo');
  }
  return response.blob();
}
