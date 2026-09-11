import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as useAuthModule from '../auth/use-auth';
import { LANDING_HEADLINE, LANDING_TAGLINE, LandingPage } from './LandingPage';

jest.mock('../auth/use-auth');

const mockedUseAuth = jest.mocked(useAuthModule.useAuth);

describe('LandingPage', () => {
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
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
  });

  test('shows the headline and tagline', () => {
    expect(screen.getByRole('heading', { level: 1, name: LANDING_HEADLINE })).toBeInTheDocument();
    expect(screen.getByText(LANDING_TAGLINE)).toBeInTheDocument();
  });

  test('explains each of the four roles', () => {
    for (const role of ['user', 'rigger', 'dropzone', 'admin']) {
      expect(screen.getByRole('heading', { level: 2, name: role })).toBeInTheDocument();
    }
  });

  test('offers sign-up and log-in calls to action', () => {
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register');
    expect(screen.getAllByRole('link', { name: 'Log in' })[0]).toHaveAttribute('href', '/login');
  });
});
