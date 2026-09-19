import { mkdtempSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ImageStorageService } from './image-storage.service';

describe('ImageStorageService', () => {
  let dir: string;
  let storage: ImageStorageService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'bendike-uploads-'));
    storage = new ImageStorageService({ uploadsDir: dir } as never);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('saves under a server-generated name and returns the public path', async () => {
    const url = await storage.save('products', Buffer.from('bytes'), 'jpeg');

    expect(url).toMatch(/^\/uploads\/products\/[0-9a-f-]{36}\.jpg$/);
    expect(readFileSync(join(dir, url.replace('/uploads/', ''))).toString()).toBe('bytes');
  });

  test('two saves never collide', async () => {
    const first = await storage.save('products', Buffer.from('a'), 'png');
    const second = await storage.save('products', Buffer.from('b'), 'png');

    expect(first).not.toBe(second);
  });

  test('remove deletes a file this service stored', async () => {
    const url = await storage.save('products', Buffer.from('x'), 'webp');

    await storage.remove(url);

    expect(existsSync(join(dir, url.replace('/uploads/', '')))).toBe(false);
  });

  test('remove ignores a URL that is not one of ours, such as a manufacturer CDN image', async () => {
    await expect(storage.remove('https://cdn.example/a.jpg')).resolves.toBeUndefined();
  });

  test('remove never leaves the uploads directory', async () => {
    const outside = join(dir, '..', 'bendike-outside.txt');
    writeFileSync(outside, 'keep me');

    await storage.remove('/uploads/../bendike-outside.txt');

    expect(existsSync(outside)).toBe(true);
    rmSync(outside);
  });

  test('remove of a file that is already gone is not an error', async () => {
    await expect(storage.remove('/uploads/products/nope.jpg')).resolves.toBeUndefined();
  });
});
