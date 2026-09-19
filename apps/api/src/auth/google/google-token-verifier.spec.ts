import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { OAuth2Client, TokenPayload } from 'google-auth-library';
import type { AppConfigService } from '../../config/app.config.service';
import { GoogleTokenVerifier } from './google-token-verifier';

const CLIENT_ID = '123-abc.apps.googleusercontent.com';

function build(clientId: string | undefined, verifyIdToken: jest.Mock) {
  const config = { googleClientId: clientId } as AppConfigService;
  const client = { verifyIdToken } as unknown as OAuth2Client;
  return new GoogleTokenVerifier(config, client);
}

function ticket(payload: Partial<TokenPayload> | undefined) {
  return { getPayload: () => payload };
}

describe('GoogleTokenVerifier', () => {
  test('returns the subject, email and name of a valid token, checked against Bendike client id', async () => {
    const verifyIdToken = jest
      .fn()
      .mockResolvedValue(
        ticket({ sub: 'sub-1', email: 'pilot@gmail.example', email_verified: true, name: 'Pilot One' }),
      );

    const identity = await build(CLIENT_ID, verifyIdToken).verify('id-token');

    expect(verifyIdToken).toHaveBeenCalledWith({ idToken: 'id-token', audience: CLIENT_ID });
    expect(identity).toEqual({ sub: 'sub-1', email: 'pilot@gmail.example', name: 'Pilot One' });
  });

  test('reports no name when the token carries none', async () => {
    const verifyIdToken = jest
      .fn()
      .mockResolvedValue(ticket({ sub: 'sub-1', email: 'pilot@gmail.example', email_verified: true }));

    expect((await build(CLIENT_ID, verifyIdToken).verify('id-token')).name).toBeNull();
  });

  test('is 401 when Google rejects the token (signature, audience, issuer or expiry)', async () => {
    const verifyIdToken = jest
      .fn()
      .mockRejectedValue(new Error('Wrong recipient, payload audience != requiredAudience'));

    await expect(build(CLIENT_ID, verifyIdToken).verify('id-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  test('is 401 when Google has not verified the email', async () => {
    const verifyIdToken = jest
      .fn()
      .mockResolvedValue(ticket({ sub: 'sub-1', email: 'pilot@gmail.example', email_verified: false }));

    await expect(build(CLIENT_ID, verifyIdToken).verify('id-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  test.each([
    ['no payload', undefined],
    ['no email', { sub: 'sub-1', email_verified: true }],
    ['no subject', { email: 'pilot@gmail.example', email_verified: true }],
  ])('is 401 for a token with %s', async (_label, payload) => {
    const verifyIdToken = jest.fn().mockResolvedValue(ticket(payload));

    await expect(build(CLIENT_ID, verifyIdToken).verify('id-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  test('is 503 without contacting Google while no client id is configured', async () => {
    const verifyIdToken = jest.fn();

    await expect(build(undefined, verifyIdToken).verify('id-token')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(verifyIdToken).not.toHaveBeenCalled();
  });
});
