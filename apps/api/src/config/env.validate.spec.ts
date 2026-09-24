import { validateEnv } from './env.validate';

const VALID_ENV = {
  DATABASE_URL: 'postgres://bendike:bendike@localhost:5432/bendike',
  JWT_SECRET: 'a-secret-that-is-definitely-longer-than-32-chars',
};

describe('validateEnv', () => {
  test('returns the config untouched when every required variable is valid', () => {
    expect(validateEnv(VALID_ENV)).toBe(VALID_ENV);
  });

  test('rejects a missing DATABASE_URL and names the variable', () => {
    const { DATABASE_URL: _omitted, ...env } = VALID_ENV;

    expect(() => validateEnv(env)).toThrow(/DATABASE_URL/);
  });

  test('rejects a JWT_SECRET shorter than 32 characters without echoing its value', () => {
    const secret = 'too-short';

    expect(() => validateEnv({ ...VALID_ENV, JWT_SECRET: secret })).toThrow(/JWT_SECRET/);
    expect(() => validateEnv({ ...VALID_ENV, JWT_SECRET: secret })).not.toThrow(new RegExp(secret));
  });

  test('rejects a malformed SEED_ADMIN_EMAIL', () => {
    expect(() => validateEnv({ ...VALID_ENV, SEED_ADMIN_EMAIL: 'not-an-email' })).toThrow(/SEED_ADMIN_EMAIL/);
  });

  test('treats an optional variable left blank in a .env file as absent', () => {
    const env = { ...VALID_ENV, SEED_ADMIN_EMAIL: '', EMAIL_OVERRIDE_TO: '', CRON_SECRET: '' };

    expect(() => validateEnv(env)).not.toThrow();
  });

  test('returns blank optional variables unchanged, so callers still see what .env said', () => {
    const env = { ...VALID_ENV, SEED_ADMIN_EMAIL: '' };

    expect(validateEnv(env)).toBe(env);
    expect(validateEnv(env).SEED_ADMIN_EMAIL).toBe('');
  });

  test('still rejects a required variable left blank', () => {
    expect(() => validateEnv({ ...VALID_ENV, DATABASE_URL: '' })).toThrow(/DATABASE_URL/);
  });
});
