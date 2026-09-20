import type { AuthMethod, UserSummary } from '@bendike/shared';
import type { User } from './user.entity';

function authMethodsOf(user: User): AuthMethod[] {
  const methods: AuthMethod[] = [];
  if (user.passwordHash !== null) {
    methods.push('password');
  }
  if (user.googleSub !== null) {
    methods.push('google');
  }
  return methods;
}

export function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    authMethods: authMethodsOf(user),
    phone: user.phone,
    locale: user.locale,
    country: user.country,
    createdAt: user.createdAt.toISOString(),
  };
}
