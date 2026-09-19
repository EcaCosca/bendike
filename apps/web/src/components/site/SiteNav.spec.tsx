import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import { SiteNav } from './SiteNav';

jest.mock('../../auth/use-auth');

function renderNavAt(path: string) {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: null,
    token: null,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
  });
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<SiteNav />} />
        <Route path="/:locale/shop" element={<SiteNav />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SiteNav shop entry', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  test('links Shop to the current locale and shows the language switcher on a locale page', () => {
    renderNavAt('/pt/shop');

    expect(screen.getByRole('link', { name: 'Loja' })).toHaveAttribute('href', '/pt/shop');
    expect(screen.getByRole('link', { name: 'Serviços' })).toHaveAttribute('href', '/pt/services');
    expect(screen.getByRole('combobox')).toHaveTextContent('PT');
  });

  test('links Shop to the detected locale and hides the switcher outside locale pages', () => {
    window.localStorage.setItem('bendike.locale', 'es');
    renderNavAt('/');

    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/es/shop');
    expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/es/services');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
