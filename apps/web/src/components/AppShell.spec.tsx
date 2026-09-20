import { Role } from '@bendike/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../auth/use-auth';
import { AppShell } from './AppShell';

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
      country: null,
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
      <AppShell>content</AppShell>
    </MemoryRouter>,
  );
}

describe('AppShell navigation', () => {
  it('gives an authority the riggers register and none of the gear links', () => {
    renderAs(Role.Authority);
    expect(screen.getByRole('link', { name: 'Riggers' })).toHaveAttribute('href', '/app/authority/riggers');
    expect(screen.getByRole('link', { name: 'Rigs' })).toHaveAttribute('href', '/app/authority/rigs');
    for (const name of ['Gear', 'Work', 'Library', 'Customers']) {
      expect(screen.queryByRole('link', { name })).not.toBeInTheDocument();
    }
  });

  it('keeps the gear links for a rigger', () => {
    renderAs(Role.Rigger);
    for (const name of ['Gear', 'Work', 'Library', 'Customers']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole('link', { name: 'Riggers' })).not.toBeInTheDocument();
  });

  it('shows a user their gear and riggers', () => {
    renderAs(Role.User);
    expect(screen.getByRole('link', { name: 'Gear' })).toHaveAttribute('href', '/app/gear');
    expect(screen.getByRole('link', { name: 'Riggers' })).toHaveAttribute('href', '/app/riggers');
  });
});
