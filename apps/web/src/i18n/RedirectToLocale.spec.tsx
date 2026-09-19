import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RedirectToLocale } from './RedirectToLocale';

describe('RedirectToLocale', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  test('redirects to the stored locale, preserving path and query', () => {
    window.localStorage.setItem('bendike.locale', 'es');

    render(
      <MemoryRouter initialEntries={['/shop?category=wingsuits']}>
        <Routes>
          <Route path="/shop" element={<RedirectToLocale />} />
          <Route path="/:locale/shop" element={<div>redirected: {window.location.pathname}</div>} />
          <Route path="/es/shop" element={<div>es shop landed</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('es shop landed')).toBeInTheDocument();
  });

  test('falls back to a browser language when nothing is stored', () => {
    const spy = jest.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['pt-BR']);

    render(
      <MemoryRouter initialEntries={['/cart']}>
        <Routes>
          <Route path="/cart" element={<RedirectToLocale />} />
          <Route path="/pt/cart" element={<div>pt cart landed</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('pt cart landed')).toBeInTheDocument();
    spy.mockRestore();
  });
});
