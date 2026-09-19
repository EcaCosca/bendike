import type { LoginRequest, RegisterRequest, UserSummary } from '@bendike/shared';
import { createContext, useContext } from 'react';

export interface AuthState {
  token: string | null;
  user: UserSummary | null;
  loading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  updateUser?: (user: UserSummary) => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
