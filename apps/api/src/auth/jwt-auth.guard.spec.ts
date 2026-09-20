import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { buildUser } from '../users/user.factory';
import { JwtAuthGuard } from './jwt-auth.guard';

function context(method: string, url: string): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ method, originalUrl: url }) }) } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard();
  const authority = buildUser({ role: Role.Authority });
  const rigger = buildUser({ role: Role.Rigger });

  test('lets a signed-in account through and refuses an anonymous one', () => {
    expect(guard.handleRequest(null, rigger, undefined, context('POST', '/api/v1/gear/rigs'))).toBe(rigger);
    expect(() => guard.handleRequest(null, false, undefined, context('GET', '/api/v1/gear'))).toThrow(
      UnauthorizedException,
    );
  });

  test.each(['GET', 'HEAD', 'OPTIONS'])('an authority can %s', (method) => {
    expect(guard.handleRequest(null, authority, undefined, context(method, '/api/v1/authority/riggers'))).toBe(
      authority,
    );
  });

  test.each(['POST', 'PUT', 'PATCH', 'DELETE'])('an authority cannot %s anything', (method) => {
    expect(() => guard.handleRequest(null, authority, undefined, context(method, '/api/v1/gear/rigs'))).toThrow(
      ForbiddenException,
    );
  });

  test('an authority can still update their own contact details', () => {
    expect(guard.handleRequest(null, authority, undefined, context('PATCH', '/api/v1/users/me'))).toBe(authority);
    expect(() => guard.handleRequest(null, authority, undefined, context('PATCH', '/api/v1/users/someone'))).toThrow(
      ForbiddenException,
    );
  });

  test('no other role is restricted by it', () => {
    for (const role of [Role.User, Role.Dropzone, Role.Admin, Role.Rigger]) {
      const user = buildUser({ role });
      expect(guard.handleRequest(null, user, undefined, context('DELETE', '/api/v1/gear/parts/1'))).toBe(user);
    }
  });
});
