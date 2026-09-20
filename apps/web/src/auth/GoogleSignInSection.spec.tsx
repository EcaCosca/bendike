import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ACCEPT_ALL, REJECT_ALL, clearConsent, readConsent, writeConsent } from '../consent/consent-storage';
import { ConsentProvider } from '../consent/ConsentProvider';
import { GoogleSignInSection } from './GoogleSignInSection';
import { GoogleClientIdContext } from './google-client-id';
import { useAuth } from './use-auth';

jest.mock('./use-auth');

const mockedUseAuth = jest.mocked(useAuth);

function installGoogle() {
  const id = { initialize: jest.fn(), renderButton: jest.fn() };
  (window as unknown as { google: unknown }).google = { accounts: { id } };
  return id;
}

function authState(loginWithGoogle: jest.Mock): ReturnType<typeof useAuth> {
  return {
    token: null,
    user: null,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    loginWithGoogle,
    logout: jest.fn(),
  };
}

function renderSection(clientId: string | undefined, onSignedIn: () => void, onError: (message: string) => void) {
  return render(
    <ConsentProvider>
      <GoogleClientIdContext.Provider value={clientId}>
        <GoogleSignInSection onSignedIn={onSignedIn} onError={onError} />
      </GoogleClientIdContext.Provider>
    </ConsentProvider>,
  );
}

describe('GoogleSignInSection', () => {
  beforeEach(() => writeConsent(ACCEPT_ALL));

  afterEach(() => {
    delete (window as unknown as { google?: unknown }).google;
    clearConsent();
  });

  test('renders nothing while no Google client id is configured', () => {
    mockedUseAuth.mockReturnValue(authState(jest.fn()));
    const id = installGoogle();

    const { container } = renderSection(undefined, jest.fn(), jest.fn());

    expect(container).toBeEmptyDOMElement();
    expect(id.initialize).not.toHaveBeenCalled();
  });

  test('signs in with the token Google returns and then reports success', async () => {
    const loginWithGoogle = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(authState(loginWithGoogle));
    const onSignedIn = jest.fn();
    const id = installGoogle();
    renderSection('client-1', onSignedIn, jest.fn());
    await waitFor(() => expect(id.initialize).toHaveBeenCalled());

    await act(async () => {
      id.initialize.mock.calls[0][0].callback({ credential: 'the-id-token' });
    });

    expect(loginWithGoogle).toHaveBeenCalledWith('the-id-token');
    await waitFor(() => expect(onSignedIn).toHaveBeenCalledTimes(1));
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  test('reports the API error when sign-in is refused', async () => {
    const loginWithGoogle = jest.fn().mockRejectedValue(new Error('Invalid Google sign-in'));
    mockedUseAuth.mockReturnValue(authState(loginWithGoogle));
    const onSignedIn = jest.fn();
    const onError = jest.fn();
    const id = installGoogle();
    renderSection('client-1', onSignedIn, onError);
    await waitFor(() => expect(id.initialize).toHaveBeenCalled());

    await act(async () => {
      id.initialize.mock.calls[0][0].callback({ credential: 'bad' });
    });

    await waitFor(() => expect(onError).toHaveBeenCalledWith('Invalid Google sign-in'));
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  describe('without permission for third-party services', () => {
    test('does not load Google, and explains why with a button to allow it', () => {
      writeConsent(REJECT_ALL);
      mockedUseAuth.mockReturnValue(authState(jest.fn()));
      const id = installGoogle();

      renderSection('client-1', jest.fn(), jest.fn());

      expect(id.initialize).not.toHaveBeenCalled();
      expect(screen.getByText(/stays off until you allow third-party services/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Allow Google sign-in' })).toBeInTheDocument();
    });

    test('allowing it records only that permission and then shows the Google button', async () => {
      const user = userEvent.setup();
      writeConsent({ preferences: true, thirdParty: false });
      mockedUseAuth.mockReturnValue(authState(jest.fn()));
      const id = installGoogle();
      renderSection('client-1', jest.fn(), jest.fn());

      await user.click(screen.getByRole('button', { name: 'Allow Google sign-in' }));

      expect(readConsent()).toMatchObject({ preferences: true, thirdParty: true });
      await waitFor(() => expect(id.initialize).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: 'Allow Google sign-in' })).not.toBeInTheDocument();
    });

    test('allowing it before any other choice does not turn preferences on', async () => {
      const user = userEvent.setup();
      clearConsent();
      mockedUseAuth.mockReturnValue(authState(jest.fn()));
      installGoogle();
      renderSection('client-1', jest.fn(), jest.fn());

      await user.click(screen.getByRole('button', { name: 'Allow Google sign-in' }));

      expect(readConsent()).toMatchObject({ preferences: false, thirdParty: true });
    });
  });
});
