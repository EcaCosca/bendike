import { Role } from '@bendike/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from './auth/use-auth';
import { App } from './App';

jest.mock('./auth/use-auth');
jest.mock('./pages/DashboardPage', () => ({ DashboardPage: () => <p>Dashboard page</p> }));
jest.mock('./pages/gear/GearPage', () => ({ GearPage: () => <p>Gear page</p> }));
jest.mock('./pages/links/LinksPage', () => ({ LinksPage: () => <p>Links page</p> }));
jest.mock('./pages/authority/AuthorityRiggersPage', () => ({
  AuthorityRiggersPage: () => <p>Register of riggers page</p>,
}));
jest.mock('./pages/authority/AuthorityRigsPage', () => ({ AuthorityRigsPage: () => <p>Packed rigs page</p> }));
jest.mock('./pages/packing/PackingSheetPrintPage', () => ({
  PackingSheetPrintPage: () => <p>Printable sheet page</p>,
}));

function renderAt(path: string, role: Role) {
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
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App routes for an authority', () => {
  it.each(['/app/gear', '/app/riggers'])('sends an authority from %s to the dashboard', (path) => {
    renderAt(path, Role.Authority);
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });

  it('lets an authority open the register', () => {
    renderAt('/app/authority/riggers', Role.Authority);
    expect(screen.getByText('Register of riggers page')).toBeInTheDocument();
  });

  it('lets an authority open the packed rigs', () => {
    renderAt('/app/authority/rigs', Role.Authority);
    expect(screen.getByText('Packed rigs page')).toBeInTheDocument();
  });

  it('sends a rigger from the packed rigs to the dashboard', () => {
    renderAt('/app/authority/rigs', Role.Rigger);
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });

  it('lets an authority open a printable sheet', () => {
    renderAt('/app/gear/rig-1/packing/sheet-1/print', Role.Authority);
    expect(screen.getByText('Printable sheet page')).toBeInTheDocument();
  });

  it('keeps the gear page for a user', () => {
    renderAt('/app/gear', Role.User);
    expect(screen.getByText('Gear page')).toBeInTheDocument();
  });

  it('sends a user from the register to the dashboard', () => {
    renderAt('/app/authority/riggers', Role.User);
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });
});
