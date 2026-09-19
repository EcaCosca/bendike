import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@bendike/shared';
import { buildUser } from '../users/user.factory';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { GoogleTokenVerifier } from './google/google-token-verifier';
import { PasswordHasher } from './password-hasher';

describe('AuthService', () => {
  const token = 'signed.jwt.token';
  let service: AuthService;
  let users: {
    findByEmail: jest.Mock;
    findByGoogleSub: jest.Mock;
    linkGoogle: jest.Mock;
    create: jest.Mock;
  };
  let google: { verify: jest.Mock };
  let hasher: { hash: jest.Mock; compare: jest.Mock };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    users = { findByEmail: jest.fn(), findByGoogleSub: jest.fn(), linkGoogle: jest.fn(), create: jest.fn() };
    google = { verify: jest.fn() };
    hasher = { hash: jest.fn(), compare: jest.fn() };
    jwt = { signAsync: jest.fn().mockResolvedValue(token) };
    const ref = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: PasswordHasher, useValue: hasher },
        { provide: JwtService, useValue: jwt },
        { provide: GoogleTokenVerifier, useValue: google },
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
  describe('signInWithGoogle', () => {
    const identity = { sub: 'google-sub-1', email: 'Pilot@Gmail.Example', name: '  Pilot One ' };

    beforeEach(() => {
      google.verify.mockResolvedValue(identity);
      users.findByGoogleSub.mockResolvedValue(null);
      users.findByEmail.mockResolvedValue(null);
    });

    test('verifies the id token with Google', async () => {
      users.create.mockImplementation((input) => Promise.resolve(buildUser(input)));

      await service.signInWithGoogle({ idToken: 'id-token' });

      expect(google.verify).toHaveBeenCalledWith('id-token');
    });

    test('creates a passwordless user account for an unknown email and returns a token', async () => {
      users.create.mockImplementation((input) => Promise.resolve(buildUser(input)));

      const result = await service.signInWithGoogle({ idToken: 'id-token' });

      expect(users.create).toHaveBeenCalledWith({
        email: identity.email,
        displayName: 'Pilot One',
        passwordHash: null,
        googleSub: identity.sub,
        role: Role.User,
      });
      expect(result.accessToken).toBe(token);
      expect(result.user.role).toBe(Role.User);
      expect(result.user.authMethods).toEqual(['google']);
    });

    test('falls back to the local part of the email when the token has no name', async () => {
      google.verify.mockResolvedValue({ ...identity, name: null });
      users.create.mockImplementation((input) => Promise.resolve(buildUser(input)));

      await service.signInWithGoogle({ idToken: 'id-token' });

      expect(users.create).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'Pilot' }));
    });

    test('signs in the account that already has the Google subject, without touching email lookups', async () => {
      const linked = buildUser({ googleSub: identity.sub, email: 'old@gmail.example' });
      users.findByGoogleSub.mockResolvedValue(linked);

      const result = await service.signInWithGoogle({ idToken: 'id-token' });

      expect(result.user.id).toBe(linked.id);
      expect(users.findByEmail).not.toHaveBeenCalled();
      expect(users.create).not.toHaveBeenCalled();
      expect(users.linkGoogle).not.toHaveBeenCalled();
    });

    test('links Google to the existing account with that email and keeps its role', async () => {
      const existing = buildUser({ role: Role.Rigger, googleSub: null });
      users.findByEmail.mockResolvedValue(existing);
      users.linkGoogle.mockImplementation((user, sub) => Promise.resolve(Object.assign(user, { googleSub: sub })));

      const result = await service.signInWithGoogle({ idToken: 'id-token' });

      expect(users.linkGoogle).toHaveBeenCalledWith(existing, identity.sub);
      expect(users.create).not.toHaveBeenCalled();
      expect(result.user.role).toBe(Role.Rigger);
      expect(result.user.authMethods).toEqual(['password', 'google']);
    });

    test('does not sign in when Google verification fails', async () => {
      google.verify.mockRejectedValue(new UnauthorizedException('Invalid Google sign-in'));

      await expect(service.signInWithGoogle({ idToken: 'bad' })).rejects.toBeInstanceOf(UnauthorizedException);
      expect(users.create).not.toHaveBeenCalled();
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('login for a Google-only account', () => {
    test('is 401 and points to Google sign-in without comparing any password', async () => {
      users.findByEmail.mockResolvedValue(buildUser({ passwordHash: null, googleSub: 'sub-1' }));

      const attempt = service.login({ email: 'pilot@gmail.example', password: 'anything at all' });

      await expect(attempt).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(attempt).rejects.toThrow(/Google/);
      expect(hasher.compare).not.toHaveBeenCalled();
    });
  });
});
