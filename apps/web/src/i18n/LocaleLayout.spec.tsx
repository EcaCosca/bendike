import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as useAuthModule from '../auth/use-auth';
import i18n from './i18n';
import { LocaleLayout } from './LocaleLayout';

// An unsupported locale now renders the site's own 404, which carries the nav and
// footer so the reader has somewhere to go. The nav asks who is signed in.
jest.mock('../auth/use-auth');

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:locale" element={<LocaleLayout />}>
          <Route path="shop" element={<div>shop page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('LocaleLayout', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    jest.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      loginWithGoogle: jest.fn(),
      logout: jest.fn(),
    });
  });

  test.each(['en', 'es', 'pt'])('renders the outlet for a supported locale "%s"', (locale) => {
    renderAt(`/${locale}/shop`);

    expect(screen.getByText('shop page')).toBeInTheDocument();
  });

  test('renders a not-found state for an unsupported locale instead of falling back to English', () => {
    renderAt('/fr/shop');

    expect(screen.queryByText('shop page')).not.toBeInTheDocument();
    // The 404 itself, whichever language it lands in — `fr` gives no clue what the
    // reader speaks, so the page falls back to the browser. NotFoundPage.spec covers
    // the wording; here it only matters that the shared page is what renders.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404');
  });
});
