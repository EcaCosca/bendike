import { OAuth2Client } from 'google-auth-library';
import type { GoogleDriveSettings } from '../config/app.config.service';
import type { AccessTokenProvider } from './google-drive-document-storage';

export class RefreshTokenProvider implements AccessTokenProvider {
  private readonly client: OAuth2Client;

  constructor(settings: GoogleDriveSettings) {
    this.client = new OAuth2Client(settings.clientId, settings.clientSecret);
    this.client.setCredentials({ refresh_token: settings.refreshToken });
  }

  async getAccessToken(): Promise<string> {
    const { token } = await this.client.getAccessToken();
    if (!token) {
      throw new Error('Google did not return an access token');
    }
    return token;
  }
}
