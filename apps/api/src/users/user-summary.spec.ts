import { toUserSummary } from './user-summary';
import { buildUser } from './user.factory';

describe('toUserSummary authMethods', () => {
  test('a password account reports password', () => {
    expect(toUserSummary(buildUser({ passwordHash: 'hash', googleSub: null })).authMethods).toEqual(['password']);
  });

  test('a Google-only account reports google', () => {
    expect(toUserSummary(buildUser({ passwordHash: null, googleSub: 'sub-1' })).authMethods).toEqual(['google']);
  });

  test('an account with both reports both', () => {
    expect(toUserSummary(buildUser({ passwordHash: 'hash', googleSub: 'sub-1' })).authMethods).toEqual([
      'password',
      'google',
    ]);
  });

  test('carries the phone and the language', () => {
    const summary = toUserSummary(buildUser({ phone: '+5493415550000', locale: 'pt' }));

    expect(summary).toMatchObject({ phone: '+5493415550000', locale: 'pt' });
  });

  test('never exposes the password hash or the Google subject', () => {
    const summary = toUserSummary(buildUser({ passwordHash: 'hash', googleSub: 'sub-1' }));

    expect(JSON.stringify(summary)).not.toContain('hash');
    expect(JSON.stringify(summary)).not.toContain('sub-1');
  });
});
