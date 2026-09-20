import { buildConsentUrl, createLibraryFolder, exchangeCode } from './drive-authorization';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('buildConsentUrl', () => {
  test('asks for offline access with the narrow drive.file scope and echoes the state', () => {
    const url = new URL(
      buildConsentUrl({ clientId: 'client-1', redirectUri: 'http://127.0.0.1:5555', state: 'state-1' }),
    );

    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe('client-1');
    expect(url.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:5555');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/drive.file');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('prompt')).toBe('consent');
    expect(url.searchParams.get('state')).toBe('state-1');
  });
});

describe('exchangeCode', () => {
  const input = {
    clientId: 'client-1',
    clientSecret: 'secret-1',
    code: 'code-1',
    redirectUri: 'http://127.0.0.1:5555',
  };

  test('trades the code for a refresh token and an access token', async () => {
    const fetchFn = jest.fn().mockResolvedValue(json({ access_token: 'access-1', refresh_token: 'refresh-1' }));

    const tokens = await exchangeCode(input, fetchFn);

    expect(tokens).toEqual({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    const body = new URLSearchParams(init.body as string);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('code-1');
    expect(body.get('client_secret')).toBe('secret-1');
  });

  test('explains what to do when Google sends no refresh token', async () => {
    const fetchFn = jest.fn().mockResolvedValue(json({ access_token: 'access-1' }));

    await expect(exchangeCode(input, fetchFn)).rejects.toThrow(/refresh token.*myaccount\.google\.com\/permissions/);
  });

  test('reports a refused code', async () => {
    const fetchFn = jest.fn().mockResolvedValue(json({ error: 'invalid_grant' }, 400));

    await expect(exchangeCode(input, fetchFn)).rejects.toThrow(/invalid_grant/);
  });
});

describe('createLibraryFolder', () => {
  test('creates a Drive folder and returns its id', async () => {
    const fetchFn = jest.fn().mockResolvedValue(json({ id: 'folder-9' }));

    const id = await createLibraryFolder('access-1', 'Bendike Library', fetchFn);

    expect(id).toBe('folder-9');
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('https://www.googleapis.com/drive/v3/files');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer access-1');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Bendike Library',
      mimeType: 'application/vnd.google-apps.folder',
    });
  });

  test('reports a Drive error', async () => {
    const fetchFn = jest.fn().mockResolvedValue(json({ error: { message: 'Drive API has not been used' } }, 403));

    await expect(createLibraryFolder('access-1', 'Bendike Library', fetchFn)).rejects.toThrow(/403/);
  });
});
