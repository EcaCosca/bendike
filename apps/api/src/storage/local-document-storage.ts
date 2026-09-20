import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { StorageError, type DocumentStorage, type StoredDocumentInput } from './document-storage';

const KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class LocalDocumentStorage implements DocumentStorage {
  private readonly root: string;

  constructor(directory: string) {
    this.root = resolve(directory);
  }

  async put(input: StoredDocumentInput): Promise<{ storageKey: string }> {
    const storageKey = randomUUID();
    try {
      await mkdir(this.root, { recursive: true });
      await writeFile(join(this.root, storageKey), input.bytes);
    } catch (cause) {
      throw new StorageError('Could not store the document on local disk', { cause });
    }
    return { storageKey };
  }

  async get(storageKey: string): Promise<Buffer> {
    if (!KEY_PATTERN.test(storageKey)) {
      throw new StorageError('Not a stored document key');
    }
    try {
      return await readFile(join(this.root, storageKey));
    } catch (cause) {
      throw new StorageError('Could not read the stored document', { cause });
    }
  }
}
