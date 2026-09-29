import type { LibraryDocumentKind } from '@bendike/shared';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const KIND_LABEL_KEYS: Record<LibraryDocumentKind, string> = {
  manual: 'library.kind.manual',
  service_bulletin: 'library.kind.service_bulletin',
  other: 'library.kind.other',
};
