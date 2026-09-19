import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AppConfigService } from './app.config.service';

const REQUIRED_ENV = {
  DATABASE_URL: 'postgres://bendike:bendike@localhost:5432/bendike',
  JWT_SECRET: 'a-secret-that-is-definitely-longer-than-32-chars',
};

async function buildConfig(env: Record<string, string>): Promise<AppConfigService> {
  const ref = await Test.createTestingModule({
    providers: [AppConfigService, { provide: ConfigService, useValue: new ConfigService(env) }],
  }).compile();
  return ref.get(AppConfigService);
}

describe('AppConfigService', () => {
  describe('when only required variables are set', () => {
    test('falls back to the documented defaults', async () => {
      const config = await buildConfig(REQUIRED_ENV);

      expect(config.port).toBe(3000);
      expect(config.jwtExpiresInSeconds).toBe(3600);
      expect(config.corsOrigin).toBe('http://localhost:5173');
      expect(config.seedAdminEmail).toBeUndefined();
      expect(config.seedAdminPassword).toBeUndefined();
      expect(config.deeplApiKey).toBeUndefined();
      expect(config.deeplApiUrl).toBe('https://api-free.deepl.com');
      expect(config.exchangeRateProviderUrl).toBe('https://open.er-api.com/v6/latest/USD');
      expect(config.uploadsDir).toBe('./uploads');
      expect(config.googleClientId).toBeUndefined();
      expect(config.emailProvider).toBe('console');
      expect(config.resendApiKey).toBeUndefined();
      expect(config.emailFrom).toBe('Bendike <onboarding@resend.dev>');
      expect(config.emailOverrideTo).toBeUndefined();
      expect(config.cronSecret).toBeUndefined();
      expect(config.webBaseUrl).toBe('http://localhost:5173');
    });
  });

  describe('when optional variables are set', () => {
    test('reads every value through', async () => {
      const config = await buildConfig({
        ...REQUIRED_ENV,
        PORT: '8080',
        JWT_EXPIRES_IN_SECONDS: '900',
        CORS_ORIGIN: 'https://bendike.example',
        SEED_ADMIN_EMAIL: 'admin@bendike.example',
        SEED_ADMIN_PASSWORD: 'correct horse battery staple',
        DEEPL_API_KEY: 'a-deepl-key',
        DEEPL_API_URL: 'https://api.deepl.com',
        EXCHANGE_RATE_PROVIDER_URL: 'https://rates.example/latest/USD',
        UPLOADS_DIR: '/var/bendike/uploads',
        GOOGLE_CLIENT_ID: '123-abc.apps.googleusercontent.com',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_test_key',
        EMAIL_FROM: 'Bendike <hola@bendike.example>',
        EMAIL_OVERRIDE_TO: 'eca@bendike.example',
        CRON_SECRET: 'a-long-cron-secret-value',
        WEB_BASE_URL: 'https://bendike.example',
      });

      expect(config.port).toBe(8080);
      expect(config.jwtExpiresInSeconds).toBe(900);
      expect(config.corsOrigin).toBe('https://bendike.example');
      expect(config.seedAdminEmail).toBe('admin@bendike.example');
      expect(config.seedAdminPassword).toBe('correct horse battery staple');
      expect(config.deeplApiKey).toBe('a-deepl-key');
      expect(config.deeplApiUrl).toBe('https://api.deepl.com');
      expect(config.exchangeRateProviderUrl).toBe('https://rates.example/latest/USD');
      expect(config.uploadsDir).toBe('/var/bendike/uploads');
      expect(config.googleClientId).toBe('123-abc.apps.googleusercontent.com');
      expect(config.emailProvider).toBe('resend');
      expect(config.resendApiKey).toBe('re_test_key');
      expect(config.emailFrom).toBe('Bendike <hola@bendike.example>');
      expect(config.emailOverrideTo).toBe('eca@bendike.example');
      expect(config.cronSecret).toBe('a-long-cron-secret-value');
      expect(config.webBaseUrl).toBe('https://bendike.example');
    });

    test('treats a blank seed admin as not configured', async () => {
      const config = await buildConfig({ ...REQUIRED_ENV, SEED_ADMIN_EMAIL: '  ', SEED_ADMIN_PASSWORD: '' });

      expect(config.seedAdminEmail).toBeUndefined();
      expect(config.seedAdminPassword).toBeUndefined();
    });

    test('treats a blank Google client id as not configured', async () => {
      const config = await buildConfig({ ...REQUIRED_ENV, GOOGLE_CLIENT_ID: '  ' });

      expect(config.googleClientId).toBeUndefined();
    });

    test('refuses to start with the Resend provider and no API key', async () => {
      await expect(buildConfig({ ...REQUIRED_ENV, EMAIL_PROVIDER: 'resend' })).rejects.toThrow(/RESEND_API_KEY/);
    });

    test('treats blank email settings as not configured', async () => {
      const config = await buildConfig({
        ...REQUIRED_ENV,
        EMAIL_OVERRIDE_TO: ' ',
        CRON_SECRET: '',
        EMAIL_PROVIDER: ' ',
      });

      expect(config.emailOverrideTo).toBeUndefined();
      expect(config.cronSecret).toBeUndefined();
      expect(config.emailProvider).toBe('console');
    });

    test('ignores a non-numeric PORT or expiry', async () => {
      const config = await buildConfig({ ...REQUIRED_ENV, PORT: 'eighty', JWT_EXPIRES_IN_SECONDS: '1h' });

      expect(config.port).toBe(3000);
      expect(config.jwtExpiresInSeconds).toBe(3600);
    });
  });
});
