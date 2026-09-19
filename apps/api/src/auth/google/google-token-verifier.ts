import { Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { OAuth2Client, TokenPayload } from 'google-auth-library';
import { AppConfigService } from '../../config/app.config.service';

export const GOOGLE_OAUTH_CLIENT = Symbol('GOOGLE_OAUTH_CLIENT');

export interface GoogleIdentity {
  sub: string;
  email: string;
  name: string | null;
}

@Injectable()
export class GoogleTokenVerifier {
  constructor(
    private readonly config: AppConfigService,
    @Inject(GOOGLE_OAUTH_CLIENT) private readonly client: OAuth2Client,
  ) {}

  async verify(idToken: string): Promise<GoogleIdentity> {
    const audience = this.config.googleClientId;
    if (!audience) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }
    const payload = await this.payloadOf(idToken, audience);
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new UnauthorizedException('Invalid Google sign-in');
    }
    return { sub: payload.sub, email: payload.email, name: payload.name ?? null };
  }

  private async payloadOf(idToken: string, audience: string): Promise<TokenPayload | undefined> {
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience });
      return ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google sign-in');
    }
  }
}
