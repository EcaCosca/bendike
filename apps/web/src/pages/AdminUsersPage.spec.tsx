import { Role, type UserSummary } from '@bendike/shared';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as authApi from '../auth/auth-api';
import { useAuth } from '../auth/use-auth';
import { AdminUsersPage } from './AdminUsersPage';

jest.mock('../auth/auth-api');
jest.mock('../auth/use-auth');

const mockedApi = jest.mocked(authApi);

function account(overrides: Partial<UserSummary>): UserSummary {
  return {
    id: 'u1',
    email: 'ana@bendike.example',
    displayName: 'Ana',
    role: Role.User,
    authMethods: ['password'],
    phone: null,
    locale: 'es',
    createdAt: '2026-09-11T10:00:00.000Z',
    ...overrides,
  };
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    jest.mocked(useAuth).mockReturnValue({
      token: 'token-1',
      user: account({ id: 'admin', role: Role.Admin, displayName: 'Admin', email: 'admin@bendike.example' }),
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      loginWithGoogle: jest.fn(),
      logout: jest.fn(),
    });
  });

  test('shows how each account signs in: password, Google or both', async () => {
    mockedApi.listUsers.mockResolvedValue([
      account({
        id: 'a',
        email: 'a@bendike.example',
        displayName: 'Ana',
        authMethods: ['password'],
        phone: null,
        locale: 'es',
      }),
      account({ id: 'b', email: 'b@bendike.example', displayName: 'Beto', authMethods: ['google'] }),
      account({ id: 'c', email: 'c@bendike.example', displayName: 'Caro', authMethods: ['password', 'google'] }),
    ]);

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );

    const rowOf = async (name: string) => within((await screen.findByText(name)).closest('tr') as HTMLElement);
    const ana = await rowOf('Ana');
    const beto = await rowOf('Beto');
    const caro = await rowOf('Caro');
    expect(ana.getByText('Password')).toBeInTheDocument();
    expect(ana.queryByText('Google')).not.toBeInTheDocument();
    expect(beto.getByText('Google')).toBeInTheDocument();
    expect(beto.queryByText('Password')).not.toBeInTheDocument();
    expect(caro.getByText('Password')).toBeInTheDocument();
    expect(caro.getByText('Google')).toBeInTheDocument();
  });
});
