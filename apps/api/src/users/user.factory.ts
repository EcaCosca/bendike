import { Role } from '@bendike/shared';
import { User } from './user.entity';

let sequence = 0;

export function buildUser(overrides: Partial<User> = {}): User {
  sequence += 1;
  const user = new User();
  user.id = `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`;
  user.email = `person${sequence}@bendike.example`;
  user.displayName = `Person ${sequence}`;
  user.passwordHash = '$2a$12$placeholderplaceholderplaceholderplaceholderplaceholde';
  user.googleSub = null;
  user.phone = null;
  user.locale = 'es';
  user.role = Role.User;
  user.createdAt = new Date('2026-09-11T10:00:00.000Z');
  user.updatedAt = user.createdAt;
  return Object.assign(user, overrides);
}
