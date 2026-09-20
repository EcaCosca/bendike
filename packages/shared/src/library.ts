export const LIBRARY_DOCUMENT_KINDS = ['manual', 'service_bulletin', 'other'] as const;
export type LibraryDocumentKind = (typeof LIBRARY_DOCUMENT_KINDS)[number];

export const LIBRARY_MAX_BYTES = 25 * 1024 * 1024;
export const LIBRARY_PAGE_SIZE = 25;

export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && url.hostname !== '' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

export interface LibraryDocumentView {
  id: string;
  title: string;
  kind: LibraryDocumentKind;
  manufacturer: string;
  modelId: string | null;
  modelName: string | null;
  revision: string | null;
  language: string | null;
  sourceUrl: string | null;
  fileName: string;
  sizeBytes: number;
  addedByName: string;
  createdAt: string;
  archivedAt: string | null;
  archiveReason: string | null;
}

export interface LibraryListResponse {
  documents: LibraryDocumentView[];
  total: number;
}

export interface ArchiveLibraryDocumentRequestBody {
  reason: string;
}
