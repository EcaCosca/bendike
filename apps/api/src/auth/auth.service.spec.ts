import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@bendike/shared';
import { buildUser } from '../users/user.factory';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { PasswordHasher } from './password-hasher';

describe('AuthService', () => {
  const token = 'signed.jwt.token';
  let service: AuthService;
  let users: { findByEmail: jest.Mock; create: jest.Mock };
  let hasher: { hash: jest.Mock; compare: jest.Mock };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    users = { findByEmail: jest.fn(), create: jest.fn() };
    hasher = { hash: jest.fn(), compare: jest.fn() };
    jwt = { signAsync: jest.fn().mockResolvedValue(token) };
    const ref = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: PasswordHasher, useValue: hasher },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = ref.get(AuthService);
  });

  describe('register', () => {
    const dto = { email: 'new@bendike.example', password: 'correct horse battery staple', displayName: '  Newcomer ' };

    test('creates the account as a plain user and returns a token', async () => {
      const hashed = 'hashed-password';
      users.findByEmail.mockResolvedValue(null);
      hasher.hash.mockResolvedValue(hashed);
      users.create.mockImplementation((input) => Promise.resolve(buildUser(input)));

      const result = await service.register(dto);

      expect(users.create).toHaveBeenCalledWith({
        email: dto.email,
        displayName: 'Newcomer',
        passwordHash: hashed,
        role: Role.User,
      });
      expect(result.accessToken).toBe(token);
      expect(result.user.role).toBe(Role.User);
      expect(JSON.stringify(result)).not.toContain(hashed);
    });

    test('signs the token with the account id, email and role', async () => {
      users.findByEmail.mockResolvedValue(null);
      hasher.hash.mockResolvedValue('hashed');
      const created = buildUser({ role: Role.User });
      users.create.mockResolvedValue(created);

      await service.register(dto);

      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: created.id, email: created.email, role: Role.User });
    });

    test('refuses a duplicate email', async () => {
      users.findByEmail.mockResolvedValue(buildUser());

      await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto = { email: 'ana@bendike.example', password: 'correct horse battery staple' };

    test('returns a token when the password matches', async () => {
      const stored = buildUser({ role: Role.Rigger });
      users.findByEmail.mockResolvedValue(stored);
      hasher.compare.mockResolvedValue(true);

      const result = await service.login(dto);

      expect(hasher.compare).toHaveBeenCalledWith(dto.password, stored.passwordHash);
      expect(result).toEqual({
        accessToken: token,
        user: expect.objectContaining({ id: stored.id, role: Role.Rigger }),
      });
    });

    test('rejects a wrong password with the same error as an unknown email', async () => {
      users.findByEmail.mockResolvedValue(buildUser());
      hasher.compare.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    test('rejects an unknown email without comparing passwords', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(hasher.compare).not.toHaveBeenCalled();
    });
  });
});
