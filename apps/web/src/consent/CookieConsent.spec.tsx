import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { clearConsent, readConsent, writeConsent } from './consent-storage';
import { ConsentProvider } from './ConsentProvider';
import { CookieConsent } from './CookieConsent';
import { useConsent } from './use-consent';

function OpenSettingsButton() {
  const { openSettings } = useConsent();
  return <button onClick={openSettings}>footer settings</button>;
}

function renderConsent() {
  render(
    <MemoryRouter>
      <ConsentProvider>
        <CookieConsent />
        <OpenSettingsButton />
      </ConsentProvider>
    </MemoryRouter>,
  );
}

describe('CookieConsent', () => {
  beforeEach(() => {
    clearConsent();
    localStorage.clear();
  });
  afterEach(() => clearConsent());

  describe('the bar', () => {
    test('asks on the first visit, with a link to the policy and three equal choices', () => {
      renderConsent();

      const bar = screen.getByRole('region', { name: 'Cookie consent' });
      expect(within(bar).getByRole('link', { name: 'cookie policy' })).toHaveAttribute('href', '/cookies');
      const accept = within(bar).getByRole('button', { name: 'Accept all' });
      const reject = within(bar).getByRole('button', { name: 'Reject non-essential' });
      expect(within(bar).getByRole('button', { name: 'Manage' })).toBeInTheDocument();
      expect(accept.className).toBe(reject.className);
    });

    test('is not shown once a choice has been made', () => {
      writeConsent({ preferences: false, thirdParty: false });
      renderConsent();

      expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
    });

    test('accepting records everything and hides the bar', async () => {
      const user = userEvent.setup();
      renderConsent();

      await user.click(screen.getByRole('button', { name: 'Accept all' }));

      expect(readConsent()).toMatchObject({ preferences: true, thirdParty: true });
      expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
    });

    test('rejecting records only the necessary and hides the bar', async () => {
      const user = userEvent.setup();
      renderConsent();

      await user.click(screen.getByRole('button', { name: 'Reject non-essential' }));

      expect(readConsent()).toMatchObject({ preferences: false, thirdParty: false });
      expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
    });

    test('Manage opens the settings', async () => {
      const user = userEvent.setup();
      renderConsent();

      await user.click(screen.getByRole('button', { name: 'Manage' }));

      expect(screen.getByRole('dialog', { name: 'Cookie settings' })).toBeInTheDocument();
    });
  });

  describe('the settings', () => {
    async function openSettings() {
      const user = userEvent.setup();
      renderConsent();
      await user.click(screen.getByRole('button', { name: 'footer settings' }));
      return { user, dialog: within(screen.getByRole('dialog', { name: 'Cookie settings' })) };
    }

    test('lists the three categories: necessary is always on, the others start off', async () => {
      const { dialog } = await openSettings();

      expect(dialog.getByRole('switch', { name: 'Necessary' })).toBeChecked();
      expect(dialog.getByRole('switch', { name: 'Necessary' })).toBeDisabled();
      expect(dialog.getByRole('switch', { name: 'Preferences' })).not.toBeChecked();
      expect(dialog.getByRole('switch', { name: 'Third-party services' })).not.toBeChecked();
      expect(dialog.getByText(/gear view/i)).toBeInTheDocument();
      expect(dialog.getByText(/Google/)).toBeInTheDocument();
    });

    test('starts from the choice already made, even after the bar is gone', async () => {
      writeConsent({ preferences: true, thirdParty: false });
      const { dialog } = await openSettings();

      expect(dialog.getByRole('switch', { name: 'Preferences' })).toBeChecked();
      expect(dialog.getByRole('switch', { name: 'Third-party services' })).not.toBeChecked();
    });

    test('saves the categories the visitor switched on', async () => {
      const { user, dialog } = await openSettings();

      await user.click(dialog.getByRole('switch', { name: 'Third-party services' }));
      await user.click(dialog.getByRole('button', { name: 'Save my choices' }));

      expect(readConsent()).toMatchObject({ preferences: false, thirdParty: true });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Cookie consent' })).not.toBeInTheDocument();
    });

    test('offers accept all and reject non-essential too', async () => {
      const { user, dialog } = await openSettings();
      await user.click(dialog.getByRole('button', { name: 'Accept all' }));
      expect(readConsent()).toMatchObject({ preferences: true, thirdParty: true });

      await user.click(screen.getByRole('button', { name: 'footer settings' }));
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reject non-essential' }));
      expect(readConsent()).toMatchObject({ preferences: false, thirdParty: false });
    });

    test('closing without saving changes nothing', async () => {
      writeConsent({ preferences: true, thirdParty: true });
      const { user, dialog } = await openSettings();

      await user.click(dialog.getByRole('switch', { name: 'Preferences' }));
      await user.click(dialog.getByRole('button', { name: 'Cancel' }));

      expect(readConsent()).toMatchObject({ preferences: true, thirdParty: true });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('links to the policy', async () => {
      const { dialog } = await openSettings();

      expect(dialog.getByRole('link', { name: 'cookie policy' })).toHaveAttribute('href', '/cookies');
    });
  });
});
