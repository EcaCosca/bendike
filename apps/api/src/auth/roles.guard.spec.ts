import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Role } from '@bendike/shared';
import { buildUser } from '../users/user.factory';
import { RolesGuard } from './roles.guard';

function contextWithUser(user: unknown): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(async () => {
    reflector = { getAllAndOverride: jest.fn() };
    const ref = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: reflector }],
    }).compile();
    guard = ref.get(RolesGuard);
  });

  test('allows any request when the handler declares no roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(contextWithUser(undefined))).toBe(true);
  });

  test.each([
    [Role.Admin, [Role.Admin]],
    [Role.Rigger, [Role.Rigger, Role.Admin]],
    [Role.Dropzone, [Role.Dropzone]],
  ])('allows a %s when the handler accepts %j', (role, required) => {
    reflector.getAllAndOverride.mockReturnValue(required);

    expect(guard.canActivate(contextWithUser(buildUser({ role })))).toBe(true);
  });

  test.each([
    [Role.User, [Role.Admin]],
    [Role.Rigger, [Role.Admin]],
    [Role.Dropzone, [Role.Admin]],
    [Role.User, [Role.Rigger]],
    [Role.Rigger, [Role.Dropzone]],
  ])('forbids a %s when the handler requires %j', (role, required) => {
    reflector.getAllAndOverride.mockReturnValue(required);

    expect(() => guard.canActivate(contextWithUser(buildUser({ role })))).toThrow(ForbiddenException);
  });

  test('forbids an unauthenticated request when roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.User]);

    expect(() => guard.canActivate(contextWithUser(undefined))).toThrow(ForbiddenException);
  });
});
