import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as useAuthModule from '../auth/use-auth';
import en from '../i18n/locales/en.json';
import es from '../i18n/locales/es.json';
import { NotFoundPage } from './NotFoundPage';

jest.mock('../auth/use-auth');

function renderAt(path: string) {
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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('NotFoundPage', () => {
  test('says what happened rather than silently redirecting', () => {
    renderAt('/does-not-exist');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404');
    expect(screen.getByText(en.notFoundPage.title)).toBeInTheDocument();
  });

  test('offers a way out, in the locale of the address that failed', () => {
    renderAt('/es/does-not-exist');

    expect(screen.getByRole('link', { name: es.notFoundPage.home })).toHaveAttribute('href', '/es');
    expect(screen.getByRole('link', { name: es.notFoundPage.shop })).toHaveAttribute('href', '/es/shop');
  });
});
