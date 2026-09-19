import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from './i18n';
import { LocaleLayout } from './LocaleLayout';

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
  });

  test.each(['en', 'es', 'pt'])('renders the outlet for a supported locale "%s"', (locale) => {
    renderAt(`/${locale}/shop`);

    expect(screen.getByText('shop page')).toBeInTheDocument();
  });

  test('renders a not-found state for an unsupported locale instead of falling back to English', () => {
    renderAt('/fr/shop');

    expect(screen.queryByText('shop page')).not.toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent(/not found/i);
  });
});
