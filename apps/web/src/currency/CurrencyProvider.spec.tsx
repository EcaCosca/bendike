import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Locale } from '@bendike/shared';
import { clearConsent, writeConsent } from '../consent/consent-storage';
import { CurrencyProvider } from './CurrencyProvider';
import { CURRENCY_KEY } from './currency-storage';
import { useCurrency } from './use-currency';

function Probe() {
  const { currency, chosen, setCurrency } = useCurrency();
  return (
    <div>
      <output data-testid="currency">{`${currency ?? 'none'} ${chosen ? 'chosen' : 'default'}`}</output>
      <button onClick={() => setCurrency('BRL')}>reais</button>
    </div>
  );
}

function renderIn(locale: Locale) {
  return render(
    <CurrencyProvider locale={locale}>
      <Probe />
    </CurrencyProvider>,
  );
}

describe('CurrencyProvider', () => {
  beforeEach(() => {
    clearConsent();
    localStorage.clear();
  });
  afterEach(() => clearConsent());

  test.each([
    ['en', 'USD'],
    ['es', 'ARS'],
    ['pt', 'BRL'],
  ] as const)('defaults to the currency of the %s locale until something is chosen', (locale, currency) => {
    renderIn(locale);

    expect(screen.getByTestId('currency')).toHaveTextContent(`${currency} default`);
  });

  test('a pick wins over the locale default and stays in memory without consent', async () => {
    const user = userEvent.setup();
    renderIn('es');

    await user.click(screen.getByRole('button', { name: 'reais' }));

    expect(screen.getByTestId('currency')).toHaveTextContent('BRL chosen');
    expect(localStorage.getItem(CURRENCY_KEY)).toBeNull();
  });

  test('with preference consent the pick is stored and read back on the next mount', async () => {
    writeConsent({ preferences: true, thirdParty: false });
    const user = userEvent.setup();
    const first = renderIn('en');
    await user.click(screen.getByRole('button', { name: 'reais' }));
    first.unmount();

    renderIn('es');

    expect(screen.getByTestId('currency')).toHaveTextContent('BRL chosen');
  });

  test('without a provider the hook reports no currency, so prices show what was entered', () => {
    render(<Probe />);

    expect(screen.getByTestId('currency')).toHaveTextContent('none default');
  });
});
