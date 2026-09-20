import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@bendike/shared';
import type { Request } from 'express';
import type { User } from '../users/user.entity';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = User>(
    err: unknown,
    user: TUser | false,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const authenticated: TUser = super.handleRequest(err, user, info, context);
    if ((authenticated as User).role === Role.Authority) {
      const request = context.switchToHttp().getRequest<Request>();
      const path = request.originalUrl.split('?')[0] ?? '';
      if (!SAFE_METHODS.has(request.method) && !(request.method === 'PATCH' && path.endsWith('/users/me'))) {
        throw new ForbiddenException('An authority account can read but not change anything');
      }
    }
    return authenticated;
  }
}
