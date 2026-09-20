export const DOCUMENT_STORAGE = Symbol('DOCUMENT_STORAGE');

export interface StoredDocumentInput {
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}

export interface DocumentStorage {
  put(input: StoredDocumentInput): Promise<{ storageKey: string }>;
  get(storageKey: string): Promise<Buffer>;
}

export class StorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StorageError';
  }
}
