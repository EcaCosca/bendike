import type { UserSummary } from '@bendike/shared';
import type { User } from './user.entity';

export function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
