/**
 * @jest-environment node
 */
import { ApiError, apiFetch } from './http';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('apiFetch', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  test('prefixes the API base path and attaches the bearer token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { status: 'ok' }));

    await apiFetch('/health', {}, 'token-123');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/health');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token-123');
  });

  test('surfaces the API error message for a failed request', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { statusCode: 401, message: 'Invalid email or password' }));

    await expect(apiFetch('/auth/login', { method: 'POST', body: '{}' })).rejects.toEqual(
      new ApiError(401, 'Invalid email or password'),
    );
  });

  test('joins validation messages when the API returns an array', async () => {
    const messages = ['email must be an email', 'password too short'];
    fetchMock.mockResolvedValue(jsonResponse(400, { statusCode: 400, message: messages }));

    await expect(apiFetch('/auth/register', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      status: 400,
      message: messages.join(', '),
    });
  });
});
