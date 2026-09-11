import type { Role } from '@bendike/shared';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
