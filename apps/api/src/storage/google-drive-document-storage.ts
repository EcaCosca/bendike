import { randomUUID } from 'node:crypto';
import { StorageError, type DocumentStorage, type StoredDocumentInput } from './document-storage';

const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id';
const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{6,}$/;

export interface AccessTokenProvider {
  getAccessToken(): Promise<string>;
}

export class GoogleDriveDocumentStorage implements DocumentStorage {
  constructor(
    private readonly folderId: string,
    private readonly tokens: AccessTokenProvider,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async put(input: StoredDocumentInput): Promise<{ storageKey: string }> {
    const boundary = `bendike-${randomUUID()}`;
    const metadata = JSON.stringify({ name: input.fileName, parents: [this.folderId], mimeType: input.mimeType });
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Type: ${input.mimeType}\r\n\r\n`),
      input.bytes,
      Buffer.from(`\r\n--${boundary}--`),
    ]);
    const response = await this.request(UPLOAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    const created = (await this.readJson(response)) as { id?: unknown };
    if (typeof created.id !== 'string' || created.id === '') {
      throw new StorageError('Google Drive did not return a file id');
    }
    return { storageKey: created.id };
  }

  async get(storageKey: string): Promise<Buffer> {
    if (!FILE_ID_PATTERN.test(storageKey)) {
      throw new StorageError('Not a Google Drive file id');
    }
    const response = await this.request(`${FILES_URL}/${encodeURIComponent(storageKey)}?alt=media`, {});
    try {
      return Buffer.from(await response.arrayBuffer());
    } catch (cause) {
      throw new StorageError('Could not read the file from Google Drive', { cause });
    }
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    let response: Response;
    try {
      const token = await this.tokens.getAccessToken();
      response = await this.fetchFn(url, {
        ...init,
        headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` },
      });
    } catch (cause) {
      throw new StorageError('Could not reach Google Drive', { cause });
    }
    if (!response.ok) {
      throw new StorageError(`Google Drive answered ${response.status}`);
    }
    return response;
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch (cause) {
      throw new StorageError('Google Drive sent an unreadable answer', { cause });
    }
  }
}
