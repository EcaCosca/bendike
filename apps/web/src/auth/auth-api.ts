import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Role,
  UpdateRoleRequest,
  UserSummary,
} from '@bendike/shared';
import { apiFetch } from '../api/http';

export function register(request: RegisterRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(request) });
}

export function login(request: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(request) });
}

export function me(token: string): Promise<UserSummary> {
  return apiFetch<UserSummary>('/auth/me', {}, token);
}

export function listUsers(token: string): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>('/users', {}, token);
}

export function changeRole(token: string, userId: string, role: Role): Promise<UserSummary> {
  const body: UpdateRoleRequest = { role };
  return apiFetch<UserSummary>(`/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify(body) }, token);
}
