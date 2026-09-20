import { Role, type UserSummary } from '@bendike/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireRole } from './RequireRole';
import * as useAuthModule from './use-auth';

jest.mock('./use-auth');

const mockedUseAuth = jest.mocked(useAuthModule.useAuth);

function renderWithRole(role: Role | null) {
  const user: UserSummary | null = role
    ? {
        id: 'u1',
        email: 'x@bendike.example',
        displayName: 'X',
        role,
        authMethods: ['password'],
        phone: null,
        locale: 'es',
        country: null,
        createdAt: '2026-09-11T10:00:00.000Z',
      }
    : null;
  mockedUseAuth.mockReturnValue({
    user,
    token: user ? 'token' : null,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
  });
  render(
    <MemoryRouter initialEntries={['/app/admin/users']}>
      <Routes>
        <Route path="/app" element={<div>dashboard</div>} />
        <Route element={<RequireRole roles={[Role.Admin]} />}>
          <Route path="/app/admin/users" element={<div>admin area</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireRole', () => {
  test('renders the protected route for an allowed role', () => {
    renderWithRole(Role.Admin);

    expect(screen.getByText('admin area')).toBeInTheDocument();
  });

  test.each([Role.User, Role.Rigger, Role.Dropzone])('sends a %s back to the dashboard', (role) => {
    renderWithRole(role);

    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.queryByText('admin area')).not.toBeInTheDocument();
  });

  test('sends an anonymous visitor back to the dashboard route', () => {
    renderWithRole(null);

    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });
});
