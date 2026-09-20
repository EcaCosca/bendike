import { Role, type UserSummary } from '@bendike/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as useAuthModule from '../../auth/use-auth';
import { ConsentProvider } from '../../consent/ConsentProvider';
import { CookieSettingsDialog } from '../../consent/CookieSettingsDialog';
import { clearConsent } from '../../consent/consent-storage';
import { CONTACT_EMAIL, FOOTER_TAGLINE, SOCIAL_LINKS, WHATSAPP_HREF } from './site-content';
import { SiteFooter } from './SiteFooter';

jest.mock('../../auth/use-auth');

const skydiver: UserSummary = {
  id: 'u1',
  email: 'ana@bendike.example',
  displayName: 'Ana',
  role: Role.User,
  authMethods: ['password'],
  phone: null,
  locale: 'es',
  country: null,
  createdAt: '2026-09-11T10:00:00.000Z',
};

function renderFooter(user: UserSummary | null = null, path = '/') {
  jest.mocked(useAuthModule.useAuth).mockReturnValue({
    user,
    token: user ? 'token' : null,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
  });
  render(
    <MemoryRouter initialEntries={[path]}>
      <ConsentProvider>
        <Routes>
          <Route path="/" element={<SiteFooter />} />
          <Route path="/:locale/shop" element={<SiteFooter />} />
        </Routes>
        <CookieSettingsDialog />
      </ConsentProvider>
    </MemoryRouter>,
  );
  return within(screen.getByRole('contentinfo'));
}

describe('SiteFooter', () => {
  beforeEach(() => clearConsent());
  afterEach(() => {
    window.localStorage.clear();
    clearConsent();
  });

  test('says what Bendike is, with the brand and the copyright of the year', () => {
    const footer = renderFooter();

    expect(footer.getByText('BENDIKE')).toBeInTheDocument();
    expect(footer.getByText(FOOTER_TAGLINE)).toBeInTheDocument();
    expect(footer.getByText(`© ${new Date().getFullYear()} Bendike. All rights reserved.`)).toBeInTheDocument();
  });

  test('links to the main pages, in the visitor language for the shop and services', () => {
    const footer = renderFooter(null, '/es/shop');

    expect(footer.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(footer.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(footer.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/es/shop');
    expect(footer.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/es/services');
  });

  test('falls back to the browser language for the shop when the page has none', () => {
    const footer = renderFooter();

    expect(footer.getByRole('link', { name: 'Shop' }).getAttribute('href')).toMatch(/^\/(en|es|pt)\/shop$/);
  });

  test('offers Log in and Sign up to a visitor', () => {
    const footer = renderFooter();

    expect(footer.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(footer.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register');
    expect(footer.queryByRole('link', { name: 'My gear' })).not.toBeInTheDocument();
  });

  test('offers the gear instead to someone signed in', () => {
    const footer = renderFooter(skydiver);

    expect(footer.getByRole('link', { name: 'My gear' })).toHaveAttribute('href', '/app/gear');
    expect(footer.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
  });

  test('has Eca email and WhatsApp, and the social links, opening safely', () => {
    const footer = renderFooter();

    expect(footer.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
    const whatsapp = footer.getByRole('link', { name: 'Message Eca on WhatsApp' });
    expect(whatsapp).toHaveAttribute('href', WHATSAPP_HREF);
    expect(whatsapp).toHaveAttribute('target', '_blank');
    expect(whatsapp).toHaveAttribute('rel', 'noopener noreferrer');
    for (const link of SOCIAL_LINKS) {
      const anchor = footer.getByRole('link', { name: link.label });
      expect(anchor).toHaveAttribute('href', link.href);
      expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  test('links to the cookie policy and reopens the cookie settings', async () => {
    const user = userEvent.setup();
    const footer = renderFooter();

    expect(footer.getByRole('link', { name: 'Cookie policy' })).toHaveAttribute('href', '/cookies');
    await user.click(footer.getByRole('button', { name: 'Cookie settings' }));

    expect(screen.getByRole('dialog', { name: 'Cookie settings' })).toBeInTheDocument();
  });

  test('groups the links under headings', () => {
    const footer = renderFooter();

    for (const heading of ['Explore', 'Account', 'Contact', 'Legal']) {
      expect(footer.getByRole('heading', { name: heading })).toBeInTheDocument();
    }
  });
});
