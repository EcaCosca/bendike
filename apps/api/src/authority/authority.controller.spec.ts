import { Reflector } from '@nestjs/core';
import { Role } from '@bendike/shared';
import { ROLES_KEY } from '../auth/roles.decorator';
import type { User } from '../users/user.entity';
import { AuthorityController } from './authority.controller';
import type { AuthorityService } from './authority.service';

describe('AuthorityController', () => {
  const service = {
    registry: jest.fn(),
    rigs: jest.fn(),
    rigger: jest.fn(),
    sheets: jest.fn(),
    work: jest.fn(),
    groundings: jest.fn(),
  };
  const controller = new AuthorityController(service as unknown as AuthorityService);

  test('is open to authorities and admins only', () => {
    expect(new Reflector().get<Role[]>(ROLES_KEY, AuthorityController)).toEqual([Role.Authority, Role.Admin]);
  });

  test('hands the search, sort and page to the registry, and the page of each list to the service', async () => {
    await controller.registry({ search: 'ana', sort: 'activity', page: 2 });
    await controller.sheets('r1', { page: 3 });
    await controller.work('r1', {});
    await controller.groundings('r1', { page: 2 });

    expect(service.registry).toHaveBeenCalledWith({ search: 'ana', sort: 'activity', page: 2 });
    expect(service.sheets).toHaveBeenCalledWith('r1', 3);
    expect(service.work).toHaveBeenCalledWith('r1', 1);
    expect(service.groundings).toHaveBeenCalledWith('r1', 2);
  });

  test('hands the signed-in account, the search, the residence and the page to the register of rigs', async () => {
    const actor = { id: 'a1', country: 'AR' } as User;

    await controller.rigs(actor, { search: 'sigma', residence: 'local', page: 2 });

    expect(service.rigs).toHaveBeenCalledWith(actor, { search: 'sigma', residence: 'local', page: 2 });
  });
});
