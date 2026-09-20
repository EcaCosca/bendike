import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalDocumentStorage } from './local-document-storage';
import { StorageError } from './document-storage';

describe('LocalDocumentStorage', () => {
  let root: string;
  let storage: LocalDocumentStorage;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'bendike-library-'));
    storage = new LocalDocumentStorage(root);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  test('stores bytes and returns the same bytes for the key it hands back', async () => {
    const { storageKey } = await storage.put({
      fileName: 'Sigma Tandem.pdf',
      mimeType: 'application/pdf',
      bytes: Buffer.from('%PDF-1.7 hello'),
    });

    expect((await storage.get(storageKey)).toString()).toBe('%PDF-1.7 hello');
  });

  test('names the file itself, never after the caller-supplied name', async () => {
    const { storageKey } = await storage.put({
      fileName: '../../etc/passwd',
      mimeType: 'application/pdf',
      bytes: Buffer.from('%PDF'),
    });

    expect(storageKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(await readdir(root)).toEqual([storageKey]);
  });

  test.each(['../secret', '/etc/passwd', 'not-a-key', ''])('refuses the key %p', async (key) => {
    await expect(storage.get(key)).rejects.toBeInstanceOf(StorageError);
  });

  test('a key that was never stored is a storage error', async () => {
    await expect(storage.get('00000000-0000-4000-8000-000000000000')).rejects.toBeInstanceOf(StorageError);
  });
});
