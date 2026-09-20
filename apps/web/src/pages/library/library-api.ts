import type { LibraryDocumentKind, LibraryDocumentView, LibraryListResponse } from '@bendike/shared';
import { API_BASE, ApiError, apiFetch } from '../../api/http';

export interface ListDocumentsParams {
  kind?: LibraryDocumentKind;
  search?: string;
  includeArchived?: boolean;
  page?: number;
}

export interface UploadFields {
  title: string;
  kind: LibraryDocumentKind;
  manufacturer?: string;
  modelId?: string;
  revision?: string;
  language?: string;
  sourceUrl?: string;
}

export function listDocuments(token: string, params: ListDocumentsParams = {}): Promise<LibraryListResponse> {
  const query = new URLSearchParams();
  if (params.kind) query.set('kind', params.kind);
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.includeArchived) query.set('includeArchived', 'true');
  if (params.page && params.page > 1) query.set('page', String(params.page));
  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  return apiFetch<LibraryListResponse>(`/library${suffix}`, {}, token);
}

export function uploadDocument(token: string, file: File, fields: UploadFields): Promise<LibraryDocumentView> {
  const form = new FormData();
  form.set('file', file);
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string' && value.trim() !== '') {
      form.set(key, value.trim());
    }
  }
  return apiFetch<LibraryDocumentView>('/library', { method: 'POST', body: form }, token);
}

export function archiveDocument(token: string, id: string, reason: string): Promise<LibraryDocumentView> {
  return apiFetch<LibraryDocumentView>(
    `/library/${id}/archive`,
    { method: 'POST', body: JSON.stringify({ reason }) },
    token,
  );
}

export async function downloadDocument(token: string, document: { id: string; fileName: string }): Promise<void> {
  const response = await fetch(`${API_BASE}/library/${document.id}/file`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new ApiError(response.status, 'Could not download the document');
  }
  const url = URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = url;
  link.download = document.fileName;
  link.click();
  URL.revokeObjectURL(url);
}
