const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FILES_URL = 'https://www.googleapis.com/drive/v3/files?fields=id';
const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export function buildConsentUrl(input: { clientId: string; redirectUri: string; state: string }): string {
  const url = new URL(AUTH_URL);
  url.searchParams.set('client_id', input.clientId);
  url.searchParams.set('redirect_uri', input.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', DRIVE_FILE_SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', input.state);
  return url.toString();
}

export async function exchangeCode(
  input: { clientId: string; clientSecret: string; code: string; redirectUri: string },
  fetchFn: typeof fetch = fetch,
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await fetchFn(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.redirectUri,
    }).toString(),
  });
  const body = (await response.json()) as { access_token?: string; refresh_token?: string; error?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`Google refused the code: ${body.error ?? response.status}`);
  }
  if (!body.refresh_token) {
    throw new Error(
      'Google sent no refresh token. Remove Bendike at https://myaccount.google.com/permissions and run the script again.',
    );
  }
  return { accessToken: body.access_token, refreshToken: body.refresh_token };
}

export async function createLibraryFolder(
  accessToken: string,
  name: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchFn(FILES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const body = (await response.json()) as { id?: string };
  if (!response.ok || !body.id) {
    throw new Error(`Google Drive would not create the folder (${response.status})`);
  }
  return body.id;
}
