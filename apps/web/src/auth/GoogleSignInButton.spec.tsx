import { act, render, waitFor } from '@testing-library/react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { GIS_SCRIPT_URL, type GoogleAccountsId } from './google-identity';

interface GoogleWindow {
  google?: { accounts: { id: GoogleAccountsId } };
}

function installGoogle() {
  const id = { initialize: jest.fn(), renderButton: jest.fn() };
  (window as unknown as GoogleWindow).google = { accounts: { id } };
  return id;
}

describe('GoogleSignInButton', () => {
  afterEach(() => {
    delete (window as unknown as GoogleWindow).google;
    document.querySelectorAll(`script[src="${GIS_SCRIPT_URL}"]`).forEach((node) => node.remove());
  });

  test('initialises Google Identity Services with the client id and renders its button', async () => {
    const id = installGoogle();

    const { container } = render(
      <GoogleSignInButton clientId="client-1" onCredential={jest.fn()} onError={jest.fn()} />,
    );

    await waitFor(() => expect(id.renderButton).toHaveBeenCalledTimes(1));
    expect(id.initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'client-1' }));
    expect(id.renderButton.mock.calls[0][0]).toBe(container.firstChild);
    expect(id.renderButton.mock.calls[0][1]).toEqual(expect.objectContaining({ text: 'continue_with' }));
  });

  test('passes the ID token Google returns to onCredential', async () => {
    const id = installGoogle();
    const onCredential = jest.fn();
    render(<GoogleSignInButton clientId="client-1" onCredential={onCredential} onError={jest.fn()} />);
    await waitFor(() => expect(id.initialize).toHaveBeenCalled());

    act(() => {
      id.initialize.mock.calls[0][0].callback({ credential: 'the-id-token' });
    });

    expect(onCredential).toHaveBeenCalledWith('the-id-token');
  });

  test('loads the Google script once when it is not on the page yet, then renders', async () => {
    const onError = jest.fn();
    render(<GoogleSignInButton clientId="client-1" onCredential={jest.fn()} onError={onError} />);
    const scripts = document.querySelectorAll(`script[src="${GIS_SCRIPT_URL}"]`);
    expect(scripts).toHaveLength(1);

    const id = installGoogle();
    act(() => {
      scripts[0]?.dispatchEvent(new Event('load'));
    });

    await waitFor(() => expect(id.renderButton).toHaveBeenCalledTimes(1));
    expect(onError).not.toHaveBeenCalled();
  });

  test('reports when the Google script cannot be loaded', async () => {
    const onError = jest.fn();
    render(<GoogleSignInButton clientId="client-1" onCredential={jest.fn()} onError={onError} />);

    act(() => {
      document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)?.dispatchEvent(new Event('error'));
    });

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/Google/)));
  });
});
