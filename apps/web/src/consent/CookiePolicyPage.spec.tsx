import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../auth/use-auth';
import { ConsentProvider } from './ConsentProvider';
import { CookieConsent } from './CookieConsent';
import { clearConsent } from './consent-storage';
import { CookiePolicyPage } from './CookiePolicyPage';
import { POLICY_UPDATED, STORAGE_INVENTORY } from './storage-inventory';

jest.mock('../auth/use-auth');

function renderPage() {
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
    <MemoryRouter>
      <ConsentProvider>
        <CookiePolicyPage />
        <CookieConsent />
      </ConsentProvider>
    </MemoryRouter>,
  );
}

describe('CookiePolicyPage', () => {
  beforeEach(() => clearConsent());
  afterEach(() => clearConsent());

  test('explains what cookies are, and is dated', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Cookie policy', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Last updated: ${POLICY_UPDATED}`))).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What cookies and browser storage are' })).toBeInTheDocument();
  });

  test('lists every item the site stores, with its category, purpose and duration', () => {
    renderPage();

    const table = screen.getByRole('table', { name: 'Cookies and browser storage' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(STORAGE_INVENTORY.length);
    const consent = within(table).getByText('bendike_consent').closest('tr') as HTMLElement;
    expect(within(consent).getByText('Cookie')).toBeInTheDocument();
    expect(within(consent).getByText('Necessary')).toBeInTheDocument();
    expect(within(consent).getByText('12 months')).toBeInTheDocument();
    const gear = within(table).getByText('bendike.gear.view').closest('tr') as HTMLElement;
    expect(within(gear).getByText('Preferences')).toBeInTheDocument();
  });

  test('names Google as the third party and says what it does', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Third parties' })).toBeInTheDocument();
    expect(screen.getAllByText(/Google/).length).toBeGreaterThan(1);
  });

  test('explains how to change the choice, with a button that opens the settings', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Open cookie settings' }));

    expect(screen.getByRole('dialog', { name: 'Cookie settings' })).toBeInTheDocument();
  });

  test('says how to remove what is stored and how to reach Eca', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Removing what is stored' })).toBeInTheDocument();
    const contact = screen.getByRole('link', { name: 'enriquecoscarelli@gmail.com' });
    expect(contact).toHaveAttribute('href', 'mailto:enriquecoscarelli@gmail.com');
  });
});
