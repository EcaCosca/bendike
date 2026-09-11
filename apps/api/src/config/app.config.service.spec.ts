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
      });

      expect(config.port).toBe(8080);
      expect(config.jwtExpiresInSeconds).toBe(900);
      expect(config.corsOrigin).toBe('https://bendike.example');
      expect(config.seedAdminEmail).toBe('admin@bendike.example');
      expect(config.seedAdminPassword).toBe('correct horse battery staple');
    });

    test('treats a blank seed admin as not configured', async () => {
      const config = await buildConfig({ ...REQUIRED_ENV, SEED_ADMIN_EMAIL: '  ', SEED_ADMIN_PASSWORD: '' });

      expect(config.seedAdminEmail).toBeUndefined();
      expect(config.seedAdminPassword).toBeUndefined();
    });

    test('ignores a non-numeric PORT or expiry', async () => {
      const config = await buildConfig({ ...REQUIRED_ENV, PORT: 'eighty', JWT_EXPIRES_IN_SECONDS: '1h' });

      expect(config.port).toBe(3000);
      expect(config.jwtExpiresInSeconds).toBe(3600);
    });
  });
});
