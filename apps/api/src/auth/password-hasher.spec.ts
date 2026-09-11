import { PasswordHasher } from './password-hasher';

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher();
  const plain = 'correct horse battery staple';

  test('produces a bcrypt hash that verifies against the original', async () => {
    const hashed = await hasher.hash(plain);

    expect(hashed).not.toContain(plain);
    await expect(hasher.compare(plain, hashed)).resolves.toBe(true);
  });

  test('rejects a different password', async () => {
    const hashed = await hasher.hash(plain);

    await expect(hasher.compare('wrong horse', hashed)).resolves.toBe(false);
  });
});
