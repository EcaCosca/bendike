import { Role, type UserSummary } from '@bendike/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as authApi from '../auth/auth-api';
import * as useAuthModule from '../auth/use-auth';
import { ProfilePage } from './ProfilePage';

jest.mock('../auth/auth-api');
jest.mock('../auth/use-auth');

const mocked = jest.mocked(authApi);

const account: UserSummary = {
  id: 'u1',
  email: 'ana@bendike.example',
  displayName: 'Ana',
  role: Role.User,
  authMethods: ['password'],
  phone: null,
  locale: 'es',
  country: null,
  createdAt: '2026-09-19T00:00:00.000Z',
};

function renderPage() {
  const updateUser = jest.fn();
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user: account,
    token: 'token-1',
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
    updateUser,
  });
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
  return { updateUser };
}

describe('ProfilePage', () => {
  test('shows the current name, phone and language', () => {
    renderPage();

    expect(screen.getByLabelText('Display name')).toHaveValue('Ana');
    expect(screen.getByLabelText(/WhatsApp phone/)).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveTextContent('Español');
    expect(screen.getByText('ana@bendike.example')).toBeInTheDocument();
  });

  test('saves the phone and the language and updates the signed-in user', async () => {
    const user = userEvent.setup();
    mocked.updateContact.mockResolvedValue({ ...account, phone: '+5493415550000', locale: 'en' });
    const { updateUser } = renderPage();

    await user.type(screen.getByLabelText(/WhatsApp phone/), '+54 9 341 555 0000');
    await user.click(screen.getByRole('combobox', { name: 'Language' }));
    await user.click(screen.getByRole('option', { name: 'English' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mocked.updateContact).toHaveBeenCalledWith('token-1', {
        displayName: 'Ana',
        phone: '+54 9 341 555 0000',
        locale: 'en',
        country: null,
      }),
    );
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ phone: '+5493415550000' })));
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  test('shows no country until one is chosen, then saves the choice', async () => {
    const user = userEvent.setup();
    mocked.updateContact.mockResolvedValue({ ...account, country: 'AR' });
    const { updateUser } = renderPage();

    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveTextContent('Not stated');
    await user.click(screen.getByRole('combobox', { name: 'Country' }));
    await user.click(await screen.findByRole('option', { name: 'Argentina' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mocked.updateContact).toHaveBeenCalledWith('token-1', expect.objectContaining({ country: 'AR' })),
    );
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ country: 'AR' })));
  });

  test('clears the country by choosing Not stated', async () => {
    const user = userEvent.setup();
    account.country = 'AR';
    mocked.updateContact.mockResolvedValue({ ...account, country: null });
    renderPage();

    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveTextContent('Argentina');
    await user.click(screen.getByRole('combobox', { name: 'Country' }));
    await user.click(await screen.findByRole('option', { name: 'Not stated' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mocked.updateContact).toHaveBeenCalledWith('token-1', expect.objectContaining({ country: null })),
    );
    account.country = null;
  });

  test('a phone without the country code is refused before any request', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/WhatsApp phone/), '341 555 0000');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/country code/);
    expect(mocked.updateContact).not.toHaveBeenCalled();
  });

  test('shows the error the API returns', async () => {
    const user = userEvent.setup();
    mocked.updateContact.mockRejectedValue(new Error('Server says no'));
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Server says no')).toBeInTheDocument();
  });
});
