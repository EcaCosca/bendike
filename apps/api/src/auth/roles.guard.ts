import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@bendike/shared';
import type { AuthenticatedRequest } from './authenticated-request';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException(`Requires one of: ${required.join(', ')}`);
    }
    return true;
  }
}
