import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as authApi from '../../auth/auth-api';
import * as useAuthModule from '../../auth/use-auth';
import { SOCIAL_LINKS } from '../../components/site/site-content';
import { ABOUT_PAGE } from './about-content';
import { AboutPage } from './AboutPage';

jest.mock('../../auth/use-auth');
jest.mock('../../auth/auth-api');

const mockedUseAuth = jest.mocked(useAuthModule.useAuth);
const mockedApi = jest.mocked(authApi);

describe('AboutPage', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AboutPage />
      </MemoryRouter>,
    );
  });

  test('has a single H1 naming the page', () => {
    const headings = screen.getAllByRole('heading', { level: 1 });

    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(ABOUT_PAGE.title);
  });

  test('presents Eca with his role and location', () => {
    expect(screen.getByRole('heading', { level: 2, name: ABOUT_PAGE.founder.displayName })).toBeInTheDocument();
    expect(screen.getByText(ABOUT_PAGE.founder.title)).toBeInTheDocument();
    expect(screen.getByText(ABOUT_PAGE.founder.location)).toBeInTheDocument();
  });

  test('covers the loft, the software and the safety priority', () => {
    for (const section of ABOUT_PAGE.sections) {
      expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument();
    }
    expect(screen.getByText(/safety is my main priority/i)).toBeInTheDocument();
  });

  test.each(SOCIAL_LINKS)('links to $label next to the founder and in the footer', (link) => {
    const anchors = screen.getAllByRole('link', { name: link.label });

    expect(anchors).toHaveLength(2);
    for (const anchor of anchors) {
      expect(anchor).toHaveAttribute('href', link.href);
      expect(anchor).toHaveAttribute('target', '_blank');
    }
  });

  test('marks About as the current page in the navigation and keeps Log in available', () => {
    const banner = screen.getByRole('banner');

    expect(within(banner).getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
    expect(within(banner).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  test('ends with a call to action into registration', () => {
    expect(screen.getByRole('link', { name: ABOUT_PAGE.cta.primary.label })).toHaveAttribute('href', '/register');
  });

  test('renders without calling the API', () => {
    const calls = Object.values(mockedApi).filter((value) => jest.isMockFunction(value));

    expect(calls).not.toHaveLength(0);
    for (const call of calls) {
      expect(call).not.toHaveBeenCalled();
    }
  });
});
