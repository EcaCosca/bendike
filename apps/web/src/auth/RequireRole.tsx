import type { Role } from '@bendike/shared';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './use-auth';

export function RequireRole({ roles }: { roles: readonly Role[] }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}
