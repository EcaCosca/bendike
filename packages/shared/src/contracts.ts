import type { CountryCode } from './countries';
import type { Locale } from './locale';
import type { Role } from './roles';

export const AUTH_METHODS = ['password', 'google'] as const;
export type AuthMethod = (typeof AUTH_METHODS)[number];

export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  authMethods: AuthMethod[];
  phone: string | null;
  locale: Locale;
  country: CountryCode | null;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface UpdateContactRequestBody {
  displayName?: string;
  phone?: string | null;
  locale?: Locale;
  country?: CountryCode | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleSignInRequest {
  idToken: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserSummary;
}

export interface UpdateRoleRequest {
  role: Role;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}
