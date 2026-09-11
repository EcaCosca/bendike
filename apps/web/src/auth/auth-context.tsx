import type { AuthResponse, LoginRequest, RegisterRequest, UserSummary } from '@bendike/shared';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from './auth-api';
import { AuthContext, type AuthState } from './use-auth';

export const TOKEN_STORAGE_KEY = 'bendike.token';

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    return;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(() => readStoredToken() !== null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    authApi
      .me(token)
      .then((current) => {
        if (!cancelled) {
          setUser(current);
        }
      })
      .catch(() => {
        if (!cancelled) {
          writeStoredToken(null);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const accept = useCallback((response: AuthResponse) => {
    writeStoredToken(response.accessToken);
    setUser(response.user);
    setToken(response.accessToken);
  }, []);

  const login = useCallback(async (request: LoginRequest) => accept(await authApi.login(request)), [accept]);
  const register = useCallback(async (request: RegisterRequest) => accept(await authApi.register(request)), [accept]);
  const logout = useCallback(() => {
    writeStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ token, user, loading, login, register, logout }),
    [token, user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
