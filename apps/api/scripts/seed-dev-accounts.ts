import 'reflect-metadata';
import { Role } from '@bendike/shared';
import dataSource from '../src/database/data-source';
import { PasswordHasher } from '../src/auth/password-hasher';
import { User } from '../src/users/user.entity';

const ACCOUNTS: { email: string; displayName: string; role: Role }[] = [
  { email: 'user@bendike.local', displayName: 'Regular User', role: Role.User },
  { email: 'rigger@bendike.local', displayName: 'Test Rigger', role: Role.Rigger },
  { email: 'dropzone@bendike.local', displayName: 'Test Dropzone', role: Role.Dropzone },
];

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to create development accounts in production');
  }
  const password = process.env.DEV_ACCOUNTS_PASSWORD;
  if (!password) {
    throw new Error('Set DEV_ACCOUNTS_PASSWORD to the password the development accounts should use');
  }
  await dataSource.initialize();
  try {
    const hasher = new PasswordHasher();
    const users = dataSource.getRepository(User);
    for (const account of ACCOUNTS) {
      const existing = await users.findOne({ where: { email: account.email } });
      if (existing) {
        console.log(`exists  ${account.email} (${existing.role})`);
        continue;
      }
      await users.save(
        users.create({
          ...account,
          passwordHash: await hasher.hash(password),
          googleSub: null,
          phone: null,
          locale: 'es',
        }),
      );
      console.log(`created ${account.email} (${account.role})`);
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
