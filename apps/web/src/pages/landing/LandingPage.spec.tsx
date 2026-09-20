import { Role, type UserSummary } from '@bendike/shared';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as authApi from '../../auth/auth-api';
import * as useAuthModule from '../../auth/use-auth';
import { SOCIAL_LINKS, WHATSAPP_LABEL, WHATSAPP_NUMBER } from '../../components/site/site-content';
import { ABOUT_TEASER, AUDIENCES, HERO, SERVICES } from './landing-content';
import { LandingPage } from './LandingPage';

jest.mock('../../auth/use-auth');
jest.mock('../../auth/auth-api');

const mockedUseAuth = jest.mocked(useAuthModule.useAuth);
const mockedApi = jest.mocked(authApi);

function renderLanding(user: UserSummary | null) {
  mockedUseAuth.mockReturnValue({
    user,
    token: user ? 'token' : null,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
  });
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

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

describe('LandingPage', () => {
  describe('for a visitor', () => {
    beforeEach(() => renderLanding(null));

    test('leads with the safety-first promise as the only H1', () => {
      const headings = screen.getAllByRole('heading', { level: 1 });

      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent(HERO.headline);
    });

    test('shows the authorized-dealer brand strip right after the hero', () => {
      const strip = screen.getByRole('region', { name: 'Authorized dealer for' });
      const hero = screen.getByRole('heading', { level: 1 }).closest('section');

      expect(hero?.nextElementSibling).toBe(strip);
      expect(
        within(strip)
          .getAllByRole('link')
          .map((link) => link.getAttribute('href')),
      ).toEqual(['/shop?brand=squirrel', '/shop?brand=vigil', '/shop?brand=flysight']);
    });

    test('offers Log in, Sign up and the About page in the navigation', () => {
      const banner = screen.getByRole('banner');

      expect(within(banner).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
      expect(within(banner).getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register');
      expect(within(banner).getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
      expect(within(banner).queryByRole('link', { name: 'Open app' })).not.toBeInTheDocument();
    });

    test('names every service', () => {
      for (const service of SERVICES) {
        expect(screen.getByRole('heading', { level: 3, name: service.title })).toBeInTheDocument();
      }
    });

    test('speaks to skydivers, riggers and dropzones', () => {
      for (const audience of AUDIENCES) {
        expect(screen.getByRole('heading', { level: 3, name: audience.role })).toBeInTheDocument();
      }
    });

    test('introduces Eca, Argentina and the safety priority, and points to the About page', () => {
      expect(screen.getByRole('heading', { level: 2, name: ABOUT_TEASER.displayName })).toBeInTheDocument();
      expect(screen.getByText(ABOUT_TEASER.location)).toBeInTheDocument();
      expect(screen.getByText(/safety is my main priority/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: ABOUT_TEASER.cta.label })).toHaveAttribute('href', '/about');
    });

    test.each(SOCIAL_LINKS)('links to $label in the about section and the footer, opening safely', (link) => {
      const anchors = screen.getAllByRole('link', { name: link.label });

      expect(anchors).toHaveLength(2);
      for (const anchor of anchors) {
        expect(anchor).toHaveAttribute('href', link.href);
        expect(anchor).toHaveAttribute('target', '_blank');
        expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
      }
    });

    test('shows the Bendike mark in the navigation, the hero and the footer', () => {
      const marks = screen.getAllByRole('img', { name: 'BENDIKE' });

      expect(marks.length).toBeGreaterThanOrEqual(3);
      for (const mark of marks) {
        expect(mark.getAttribute('src')).toMatch(/^\/brand\/mark-(gold|white)-\d+\.png$/);
      }
    });

    test('floats a WhatsApp button that opens a chat with Eca in a new tab', () => {
      const button = screen.getByRole('link', { name: WHATSAPP_LABEL });

      expect(button.getAttribute('href')).toMatch(new RegExp(`^https://wa\\.me/${WHATSAPP_NUMBER}\\?text=`));
      expect(button).toHaveAttribute('target', '_blank');
      expect(button).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('renders without calling the API', () => {
      const calls = Object.values(mockedApi).filter((value) => jest.isMockFunction(value));

      expect(calls).not.toHaveLength(0);
      for (const call of calls) {
        expect(call).not.toHaveBeenCalled();
      }
    });
  });

  describe('for a signed-in account', () => {
    beforeEach(() => renderLanding(skydiver));

    test('replaces Log in and Sign up with Open app', () => {
      const banner = screen.getByRole('banner');

      expect(within(banner).getByRole('link', { name: 'Open app' })).toHaveAttribute('href', '/app');
      expect(within(banner).queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
      expect(within(banner).queryByRole('link', { name: 'Sign up' })).not.toBeInTheDocument();
    });
  });
});
