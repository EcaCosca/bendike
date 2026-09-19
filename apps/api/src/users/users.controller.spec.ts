import { Test } from '@nestjs/testing';
import { Role } from '@bendike/shared';
import { buildUser } from './user.factory';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let users: { findAll: jest.Mock; changeRole: jest.Mock };

  beforeEach(async () => {
    users = { findAll: jest.fn(), changeRole: jest.fn() };
    const ref = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: users }],
    }).compile();
    controller = ref.get(UsersController);
  });

  test('GET /users returns summaries without password hashes', async () => {
    const stored = buildUser({ role: Role.Rigger });
    users.findAll.mockResolvedValue([stored]);

    const result = await controller.list();

    expect(result).toEqual([
      {
        id: stored.id,
        email: stored.email,
        displayName: stored.displayName,
        role: Role.Rigger,
        authMethods: ['password'],
        phone: null,
        locale: 'es',
        createdAt: stored.createdAt.toISOString(),
      },
    ]);
    expect(JSON.stringify(result)).not.toContain(stored.passwordHash ?? 'unreachable');
  });

  test('PATCH /users/:id/role delegates to the service with the acting admin', async () => {
    const actor = buildUser({ role: Role.Admin });
    const target = buildUser({ role: Role.Rigger });
    users.changeRole.mockResolvedValue(target);

    const result = await controller.changeRole(actor, target.id, { role: Role.Rigger });

    expect(users.changeRole).toHaveBeenCalledWith(actor.id, target.id, Role.Rigger);
    expect(result.role).toBe(Role.Rigger);
  });
});
