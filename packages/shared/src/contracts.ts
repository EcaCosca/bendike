import type { Role } from './roles';

export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
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
