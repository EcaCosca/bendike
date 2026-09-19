import { gearItem } from './fixtures';
import { detailLine, identityLine } from './item-details';

describe('identityLine', () => {
  test('joins make and model, serial and date of manufacture', () => {
    expect(identityLine(gearItem('reserve', { serial: '10586', manufacturedOn: '2020-09-01' }))).toBe(
      'PD VR360 · #10586 · made 2020-09-01',
    );
  });

  test('leaves out what is not known', () => {
    expect(identityLine(gearItem('reserve', { serial: null }))).toBe('PD VR360');
  });
});

describe('detailLine', () => {
  test('describes each kind with its own fields', () => {
    expect(detailLine(gearItem('container', { details: { harnessSize: 'M', tso: 'C23d' } }))).toBe(
      'Harness M · TSO C23d',
    );
    expect(detailLine(gearItem('main', { details: { sizeSqft: 190, lineType: 'Vectran' } }))).toBe(
      '190 sq ft · Vectran',
    );
    expect(detailLine(gearItem('reserve', { details: { sizeSqft: 143, repackCycleDays: 90, deployments: 1 } }))).toBe(
      '143 sq ft · repack every 90 days · 1 deployments',
    );
    expect(
      detailLine(
        gearItem('aad', {
          details: {
            mode: 'Student',
            batteryInstalledOn: '2025-01-15',
            batteryCycleMonths: null,
            serviceDueOn: null,
            expiresOn: null,
          },
        }),
      ),
    ).toBe('Mode Student · Battery installed 2025-01-15');
  });

  test('is empty when nothing is recorded', () => {
    expect(
      detailLine(gearItem('reserve', { details: { sizeSqft: null, repackCycleDays: null, deployments: 0 } })),
    ).toBe('');
  });
});
