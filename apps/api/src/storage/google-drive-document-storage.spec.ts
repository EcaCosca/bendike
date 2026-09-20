import { StorageError } from './document-storage';
import { GoogleDriveDocumentStorage } from './google-drive-document-storage';

function setup(respond: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const fetchFn = jest.fn((url: string, init: RequestInit = {}) => Promise.resolve(respond(url, init)));
  const tokens = { getAccessToken: jest.fn().mockResolvedValue('access-token-1') };
  const storage = new GoogleDriveDocumentStorage('folder-123', tokens, fetchFn as unknown as typeof fetch);
  return { storage, fetchFn, tokens };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('GoogleDriveDocumentStorage', () => {
  test('uploads into the configured folder with the access token and returns the Drive file id', async () => {
    const { storage, fetchFn } = setup(() => json({ id: 'drive-file-9' }));

    const result = await storage.put({
      fileName: 'Man013 Rev4.pdf',
      mimeType: 'application/pdf',
      bytes: Buffer.from('%PDF-1.7 body'),
    });

    expect(result).toEqual({ storageKey: 'drive-file-9' });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('https://www.googleapis.com/upload/drive/v3/files');
    expect(url).toContain('uploadType=multipart');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer access-token-1');
    expect(headers['Content-Type']).toMatch(/^multipart\/related; boundary=/);
    const body = Buffer.from(init.body as Buffer).toString('latin1');
    expect(body).toContain('"parents":["folder-123"]');
    expect(body).toContain('"name":"Man013 Rev4.pdf"');
    expect(body).toContain('%PDF-1.7 body');
  });

  test('downloads a file by its id', async () => {
    const { storage, fetchFn } = setup(() => new Response(Buffer.from('%PDF-1.7 stored')));

    const bytes = await storage.get('drive-file-9');

    expect(bytes.toString()).toBe('%PDF-1.7 stored');
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://www.googleapis.com/drive/v3/files/drive-file-9?alt=media');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer access-token-1');
  });

  test.each([
    ['Drive answers an error', () => json({ error: { message: 'quota' } }, 403)],
    ['Drive answers without an id', () => json({})],
  ])('%s', async (_name, respond) => {
    const { storage } = setup(respond);

    await expect(
      storage.put({ fileName: 'a.pdf', mimeType: 'application/pdf', bytes: Buffer.from('%PDF') }),
    ).rejects.toBeInstanceOf(StorageError);
  });

  test('a download error is a storage error', async () => {
    const { storage } = setup(() => json({}, 404));

    await expect(storage.get('gone-file-id-1')).rejects.toBeInstanceOf(StorageError);
  });

  test('a network failure is a storage error', async () => {
    const { storage } = setup(() => {
      throw new Error('socket hang up');
    });

    await expect(storage.get('drive-file-9')).rejects.toBeInstanceOf(StorageError);
  });

  test('a token that cannot be refreshed is a storage error', async () => {
    const { storage, tokens } = setup(() => json({ id: 'x' }));
    tokens.getAccessToken.mockRejectedValue(new Error('invalid_grant'));

    await expect(storage.get('drive-file-9')).rejects.toBeInstanceOf(StorageError);
  });

  test.each(['../x', 'a/b', '', 'a b'])('refuses the file id %p', async (key) => {
    const { storage, fetchFn } = setup(() => json({}));

    await expect(storage.get(key)).rejects.toBeInstanceOf(StorageError);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
