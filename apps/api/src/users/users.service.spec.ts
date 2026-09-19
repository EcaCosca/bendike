import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '@bendike/shared';
import { User } from './user.entity';
import { buildUser } from './user.factory';
import { normalizeEmail, UsersService } from './users.service';

describe('normalizeEmail', () => {
  test('lowercases and trims so lookups are case-insensitive', () => {
    expect(normalizeEmail('  Ana.Rigger@Bendike.Example ')).toBe('ana.rigger@bendike.example');
  });
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repository = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    const ref = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: repository }],
    }).compile();
    service = ref.get(UsersService);
  });

  describe('findByEmail', () => {
    test('queries with the normalized email', async () => {
      repository.findOne.mockResolvedValue(null);

      await service.findByEmail('  Someone@Bendike.Example');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'someone@bendike.example' } });
    });
  });

  describe('findByGoogleSub', () => {
    test('queries by the Google subject', async () => {
      repository.findOne.mockResolvedValue(null);

      await service.findByGoogleSub('sub-123');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { googleSub: 'sub-123' } });
    });
  });

  describe('linkGoogle', () => {
    test('stores the Google subject on the account', async () => {
      const target = buildUser({ googleSub: null });
      repository.save.mockImplementation((value: User) => Promise.resolve(value));

      const linked = await service.linkGoogle(target, 'sub-123');

      expect(linked.googleSub).toBe('sub-123');
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ id: target.id, googleSub: 'sub-123' }));
    });
  });

  describe('create', () => {
    test('persists the normalized email and the requested role', async () => {
      const input = {
        email: 'New.Person@Bendike.Example',
        displayName: 'New Person',
        passwordHash: 'hash',
        role: Role.User,
      };
      repository.create.mockImplementation((value: Partial<User>) => Object.assign(new User(), value));
      repository.save.mockImplementation((value: User) => Promise.resolve(value));

      const created = await service.create(input);

      expect(created.email).toBe('new.person@bendike.example');
      expect(created.role).toBe(Role.User);
      expect(repository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('create without a password', () => {
    test('persists a Google account with its subject and no password hash', async () => {
      repository.create.mockImplementation((value: Partial<User>) => Object.assign(new User(), value));
      repository.save.mockImplementation((value: User) => Promise.resolve(value));

      const created = await service.create({
        email: 'Pilot@Gmail.Example',
        displayName: 'Pilot',
        passwordHash: null,
        googleSub: 'sub-9',
        role: Role.User,
      });

      expect(created.passwordHash).toBeNull();
      expect(created.googleSub).toBe('sub-9');
      expect(created.email).toBe('pilot@gmail.example');
    });
  });

  describe('updateContact', () => {
    beforeEach(() => {
      repository.save.mockImplementation((value: User) => Promise.resolve(value));
    });

    test('stores the phone in international form and the language', async () => {
      const user = buildUser();

      const updated = await service.updateContact(user, { phone: '+54 9 341 555 0000', locale: 'pt' });

      expect(updated).toMatchObject({ phone: '+5493415550000', locale: 'pt' });
      expect(repository.save).toHaveBeenCalledWith(user);
    });

    test('a blank phone clears it, and an omitted field is left alone', async () => {
      const user = buildUser({ phone: '+5493415550000', locale: 'en', displayName: 'Ana' });

      expect(await service.updateContact(user, { phone: '  ' })).toMatchObject({
        phone: null,
        locale: 'en',
        displayName: 'Ana',
      });
    });

    test('changes the display name, trimmed', async () => {
      const user = buildUser({ displayName: 'Ana' });

      expect((await service.updateContact(user, { displayName: '  Ana Rigger ' })).displayName).toBe('Ana Rigger');
    });

    test('a phone without the country code is 400 and nothing is saved', async () => {
      await expect(service.updateContact(buildUser(), { phone: '341 555 0000' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    test('an empty display name is 400', async () => {
      await expect(service.updateContact(buildUser(), { displayName: '   ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('changeRole', () => {
    const admin = buildUser({ role: Role.Admin });

    test('promotes another account and saves it', async () => {
      const target = buildUser({ role: Role.User });
      repository.findOne.mockResolvedValue(target);
      repository.save.mockImplementation((value: User) => Promise.resolve(value));

      const updated = await service.changeRole(admin.id, target.id, Role.Rigger);

      expect(updated.role).toBe(Role.Rigger);
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ id: target.id, role: Role.Rigger }));
    });

    test('refuses when the admin targets their own account', async () => {
      await expect(service.changeRole(admin.id, admin.id, Role.User)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.findOne).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    test('reports an unknown target as not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.changeRole(admin.id, 'missing-id', Role.Rigger)).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
