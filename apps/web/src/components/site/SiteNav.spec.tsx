import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import { CurrencyProvider } from '../../currency/CurrencyProvider';
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
        <Route
          path="/:locale/shop"
          element={
            <CurrencyProvider locale="pt">
              <SiteNav />
            </CurrencyProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SiteNav shop entry', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  test('links Shop, Services and Learn to the current locale and shows the language switcher on a locale page', () => {
    renderNavAt('/pt/shop');

    expect(screen.getByRole('link', { name: 'Loja' })).toHaveAttribute('href', '/pt/shop');
    expect(screen.getByRole('link', { name: 'Serviços' })).toHaveAttribute('href', '/pt/services');
    expect(screen.getByRole('link', { name: 'Aprender' })).toHaveAttribute('href', '/pt/learn');
    expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('PT');
  });

  test('shows the currency switcher beside the language, defaulting to the locale currency, with the three options', async () => {
    const user = userEvent.setup();
    renderNavAt('/pt/shop');

    const [, currency] = screen.getAllByRole('combobox');
    expect(currency).toHaveTextContent('R$');

    await user.click(currency!);
    const listbox = screen.getByRole('listbox');
    expect(
      within(listbox)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['US$', 'AR$', 'R$']);

    await user.click(within(listbox).getByRole('option', { name: 'AR$' }));
    expect(screen.getAllByRole('combobox')[1]).toHaveTextContent('AR$');
  });

  test('links Shop to the detected locale and hides both switchers outside locale pages', () => {
    window.localStorage.setItem('bendike.locale', 'es');
    renderNavAt('/');

    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/es/shop');
    expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/es/services');
    expect(screen.getByRole('link', { name: 'Learn' })).toHaveAttribute('href', '/es/learn');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
