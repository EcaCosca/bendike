import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { clearConsent, readConsent, writeConsent } from './consent-storage';
import { ConsentProvider } from './ConsentProvider';
import { useConsent } from './use-consent';

function Probe() {
  const consent = useConsent();
  return (
    <div>
      <p data-testid="decided">{String(consent.choice !== null)}</p>
      <p data-testid="preferences">{String(consent.allows('preferences'))}</p>
      <p data-testid="thirdParty">{String(consent.allows('thirdParty'))}</p>
      <p data-testid="open">{String(consent.settingsOpen)}</p>
      <button onClick={consent.acceptAll}>accept</button>
      <button onClick={consent.rejectAll}>reject</button>
      <button onClick={() => consent.save({ preferences: true, thirdParty: false })}>save</button>
      <button onClick={consent.openSettings}>open</button>
      <button onClick={consent.closeSettings}>close</button>
    </div>
  );
}

const text = (id: string) => screen.getByTestId(id).textContent;

describe('ConsentProvider', () => {
  beforeEach(() => clearConsent());
  afterEach(() => clearConsent());

  test('starts undecided and allows nothing optional', () => {
    render(
      <ConsentProvider>
        <Probe />
      </ConsentProvider>,
    );

    expect(text('decided')).toBe('false');
    expect(text('preferences')).toBe('false');
    expect(text('thirdParty')).toBe('false');
  });

  test('starts from a choice already made in the cookie', () => {
    writeConsent({ preferences: true, thirdParty: false });
    render(
      <ConsentProvider>
        <Probe />
      </ConsentProvider>,
    );

    expect(text('decided')).toBe('true');
    expect(text('preferences')).toBe('true');
    expect(text('thirdParty')).toBe('false');
  });

  test('accept all, reject all and a custom save each record the choice', async () => {
    const user = userEvent.setup();
    render(
      <ConsentProvider>
        <Probe />
      </ConsentProvider>,
    );

    await user.click(screen.getByText('accept'));
    expect(text('preferences')).toBe('true');
    expect(text('thirdParty')).toBe('true');
    expect(readConsent()).toMatchObject({ preferences: true, thirdParty: true });

    await user.click(screen.getByText('reject'));
    expect(text('preferences')).toBe('false');
    expect(readConsent()).toMatchObject({ preferences: false, thirdParty: false });

    await user.click(screen.getByText('save'));
    expect(text('preferences')).toBe('true');
    expect(text('thirdParty')).toBe('false');
  });

  test('saving closes the settings, and they can be opened again', async () => {
    const user = userEvent.setup();
    render(
      <ConsentProvider>
        <Probe />
      </ConsentProvider>,
    );

    await user.click(screen.getByText('open'));
    expect(text('open')).toBe('true');
    await user.click(screen.getByText('save'));
    expect(text('open')).toBe('false');
    await user.click(screen.getByText('open'));
    await user.click(screen.getByText('close'));
    expect(text('open')).toBe('false');
  });

  test('outside a provider nothing optional is allowed and the actions do nothing', async () => {
    const user = userEvent.setup();
    render(<Probe />);

    await user.click(screen.getByText('accept'));

    expect(text('preferences')).toBe('false');
    expect(readConsent()).toBeNull();
  });
});
