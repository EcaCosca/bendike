import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@bendike/shared';
import { AppConfigService } from '../config/app.config.service';
import { buildUser } from '../users/user.factory';
import { UsersService } from '../users/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let users: { findById: jest.Mock };

  beforeEach(async () => {
    users = { findById: jest.fn() };
    const config = { jwtSecret: 'a-secret-that-is-definitely-longer-than-32-chars' } as AppConfigService;
    const ref = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: AppConfigService, useValue: config },
        { provide: UsersService, useValue: users },
      ],
    }).compile();
    strategy = ref.get(JwtStrategy);
  });

  test('resolves the current database record so role changes apply immediately', async () => {
    const stored = buildUser({ role: Role.Admin });
    users.findById.mockResolvedValue(stored);

    const user = await strategy.validate({ sub: stored.id, email: stored.email, role: Role.User });

    expect(user).toBe(stored);
    expect(user.role).toBe(Role.Admin);
  });

  test('rejects a token whose account was deleted', async () => {
    users.findById.mockResolvedValue(null);

    const payload = { sub: 'gone', email: 'gone@bendike.example', role: Role.User };

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
