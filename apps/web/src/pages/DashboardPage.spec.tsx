import { Role } from '@bendike/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../auth/use-auth';
import { DashboardPage } from './DashboardPage';

jest.mock('../auth/use-auth');

function renderAs(role: Role) {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: {
      id: 'u1',
      email: 'x@b.c',
      displayName: 'Someone',
      role,
      authMethods: ['password'],
      phone: null,
      locale: 'es',
      createdAt: '2026-09-19T00:00:00.000Z',
    },
    token: 'token-1',
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
  });
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  it('offers an authority the register of riggers and no gear shortcuts', () => {
    renderAs(Role.Authority);
    expect(screen.getByRole('link', { name: 'Register of riggers' })).toHaveAttribute('href', '/app/authority/riggers');
    for (const name of ['My gear', 'Fleet', 'Work queue', 'My riggers', 'Customers and dropzones']) {
      expect(screen.queryByRole('link', { name })).not.toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Your details' })).toBeInTheDocument();
  });

  it('keeps the gear shortcuts for a user', () => {
    renderAs(Role.User);
    expect(screen.getByRole('link', { name: 'My gear' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Register of riggers' })).not.toBeInTheDocument();
  });

  it('lets an admin reach both the work queue and the register of riggers', () => {
    renderAs(Role.Admin);
    expect(screen.getByRole('link', { name: 'Work queue' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register of riggers' })).toBeInTheDocument();
  });
});
