import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleSwitcher } from './LocaleSwitcher';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:locale/shop/:slug" element={<LocaleSwitcher />} />
        <Route path="/pt/shop/:slug" element={<div>landed on pt</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LocaleSwitcher', () => {
  test('shows the current locale as the selected value', () => {
    renderAt('/es/shop/freak6');

    expect(screen.getByRole('combobox')).toHaveTextContent('ES');
  });

  test('switching locale navigates to the same page under the new locale', async () => {
    const user = userEvent.setup();
    renderAt('/es/shop/freak6');

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'PT' }));

    expect(screen.getByText('landed on pt')).toBeInTheDocument();
  });
});
