import { Test } from '@nestjs/testing';
import { Role } from '@bendike/shared';
import { AppConfigService } from '../config/app.config.service';
import { buildUser } from '../users/user.factory';
import { UsersService } from '../users/users.service';
import { AdminSeedService } from './admin-seed.service';
import { PasswordHasher } from './password-hasher';

describe('AdminSeedService', () => {
  const email = 'admin@bendike.example';
  const password = 'correct horse battery staple';
  let users: { findByEmail: jest.Mock; create: jest.Mock };
  let hasher: { hash: jest.Mock };

  async function buildService(config: Partial<AppConfigService>): Promise<AdminSeedService> {
    const ref = await Test.createTestingModule({
      providers: [
        AdminSeedService,
        { provide: AppConfigService, useValue: config },
        { provide: UsersService, useValue: users },
        { provide: PasswordHasher, useValue: hasher },
      ],
    }).compile();
    return ref.get(AdminSeedService);
  }

  beforeEach(() => {
    users = { findByEmail: jest.fn(), create: jest.fn() };
    hasher = { hash: jest.fn().mockResolvedValue('hashed') };
  });

  test('does nothing when no seed admin is configured', async () => {
    const service = await buildService({ seedAdminEmail: undefined, seedAdminPassword: undefined });

    await expect(service.seed()).resolves.toBe('skipped');
    expect(users.findByEmail).not.toHaveBeenCalled();
  });

  test('creates the admin account when it does not exist yet', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue(buildUser({ role: Role.Admin }));
    const service = await buildService({ seedAdminEmail: email, seedAdminPassword: password });

    await expect(service.seed()).resolves.toBe('created');
    expect(hasher.hash).toHaveBeenCalledWith(password);
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({ email, role: Role.Admin, passwordHash: 'hashed' }),
    );
  });

  test('leaves an existing account untouched', async () => {
    users.findByEmail.mockResolvedValue(buildUser({ email, role: Role.User }));
    const service = await buildService({ seedAdminEmail: email, seedAdminPassword: password });

    await expect(service.seed()).resolves.toBe('exists');
    expect(users.create).not.toHaveBeenCalled();
  });
});
