import { Role, type AuthResponse } from '@bendike/shared';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as authApi from './auth-api';
import { AuthProvider, TOKEN_STORAGE_KEY } from './auth-context';
import { useAuth } from './use-auth';

jest.mock('./auth-api');

const mockedApi = jest.mocked(authApi);

function Probe() {
  const { user, token, loading, login, loginWithGoogle, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <span data-testid="role">{user?.role ?? 'anonymous'}</span>
      <button onClick={() => void login({ email: 'ana@bendike.example', password: 'correct horse battery staple' })}>
        login
      </button>
      <button onClick={() => void loginWithGoogle('google-id-token')}>login with google</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

const response: AuthResponse = {
  accessToken: 'jwt-token',
  user: {
    id: 'u1',
    email: 'ana@bendike.example',
    displayName: 'Ana',
    role: Role.Rigger,
    authMethods: ['password'],
    phone: null,
    locale: 'es',
    createdAt: '2026-09-11T10:00:00.000Z',
  },
};

function renderProbe() {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('starts anonymous when no token is stored', () => {
    renderProbe();

    expect(screen.getByTestId('role')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  test('stores the token and exposes the user after login', async () => {
    mockedApi.login.mockResolvedValue(response);
    mockedApi.me.mockResolvedValue(response.user);
    renderProbe();

    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent(Role.Rigger));
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('jwt-token');
  });

  test('stores the token and exposes the user after signing in with Google', async () => {
    mockedApi.loginWithGoogle.mockResolvedValue(response);
    mockedApi.me.mockResolvedValue(response.user);
    renderProbe();

    await userEvent.click(screen.getByRole('button', { name: 'login with google' }));

    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent(Role.Rigger));
    expect(mockedApi.loginWithGoogle).toHaveBeenCalledWith({ idToken: 'google-id-token' });
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('jwt-token');
  });

  test('restores the session from a stored token', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'stored-token');
    mockedApi.me.mockResolvedValue(response.user);
    renderProbe();

    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent(Role.Rigger));
    expect(mockedApi.me).toHaveBeenCalledWith('stored-token');
  });

  test('drops a stored token the API rejects', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'expired-token');
    mockedApi.me.mockRejectedValue(new Error('unauthorized'));
    renderProbe();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  test('logout clears the token and the user', async () => {
    mockedApi.login.mockResolvedValue(response);
    mockedApi.me.mockResolvedValue(response.user);
    renderProbe();
    await userEvent.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent(Role.Rigger));

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'logout' }));
    });

    expect(screen.getByTestId('role')).toHaveTextContent('anonymous');
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
