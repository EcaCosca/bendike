import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
