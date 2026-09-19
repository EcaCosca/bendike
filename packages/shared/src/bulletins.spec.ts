import {
  matchGearToBulletin,
  matchGearToTarget,
  normalizeName,
  type BulletinDefinition,
  type GearIdentity,
} from './bulletins';

const gear = (overrides: Partial<GearIdentity> = {}): GearIdentity => ({
  manufacturer: 'PD',
  model: 'VR360',
  serial: '10586',
  manufacturedOn: '2020-09-01',
  ...overrides,
});

describe('normalizeName', () => {
  test.each([
    ['PD', 'pd'],
    ['Performance Designs', 'performancedesigns'],
    ['VR-360', 'vr360'],
    ['vr 360', 'vr360'],
    ['Vigil_2+', 'vigil2+'],
    ['  Micro.Sigma ', 'microsigma'],
  ])('%s becomes %s', (input, expected) => {
    expect(normalizeName(input)).toBe(expected);
  });
});

describe('matchGearToTarget', () => {
  test('a target with nothing but the manufacturer matches every model of it', () => {
    expect(matchGearToTarget('PD', {}, gear())).toBe('exact');
    expect(matchGearToTarget('pd', {}, gear({ model: 'anything' }))).toBe('exact');
  });

  test('another manufacturer never matches', () => {
    expect(matchGearToTarget('Aerodyne', {}, gear())).toBeNull();
  });

  test('the model is compared exactly after normalising case, spaces and hyphens, never by similarity', () => {
    expect(matchGearToTarget('PD', { model: 'vr 360' }, gear({ model: 'VR-360' }))).toBe('exact');
    expect(matchGearToTarget('PD', { model: 'VR360' }, gear({ model: 'VR360 Lite' }))).toBeNull();
    expect(
      matchGearToTarget('Vigil', { model: 'Cuatro' }, gear({ manufacturer: 'Vigil', model: 'Vigil 4' })),
    ).toBeNull();
  });

  test.each([
    ['1000', '2000', '1500', 'exact'],
    ['1000', '2000', '1000', 'exact'],
    ['1000', '2000', '2000', 'exact'],
    ['1000', '2000', '999', null],
    ['1000', '2000', '2001', null],
    ['1000', null, '5000', 'exact'],
    [null, '2000', '3000', null],
  ])('serial range %s to %s and serial %s is %s', (from, to, serial, expected) => {
    expect(matchGearToTarget('PD', { serialFrom: from, serialTo: to }, gear({ serial }))).toBe(expected);
  });

  test('numbers are compared as numbers, not text', () => {
    expect(matchGearToTarget('PD', { serialFrom: '900', serialTo: '1200' }, gear({ serial: '1000' }))).toBe('exact');
  });

  test('a serial that cannot be compared is flagged for review instead of skipped', () => {
    expect(matchGearToTarget('PD', { serialFrom: '1000', serialTo: '2000' }, gear({ serial: 'VR-360 007284' }))).toBe(
      'needs_review',
    );
    expect(matchGearToTarget('PD', { serialFrom: '1000', serialTo: '2000' }, gear({ serial: null }))).toBe(
      'needs_review',
    );
    expect(matchGearToTarget('PD', { serialFrom: 'A100', serialTo: 'A200' }, gear({ serial: 'A150' }))).toBe(
      'needs_review',
    );
  });

  test('the manufacture date range is inclusive, and a missing date is flagged for review', () => {
    const target = { manufacturedFrom: '2018-01-01', manufacturedTo: '2019-12-31' };

    expect(matchGearToTarget('PD', target, gear({ manufacturedOn: '2018-01-01' }))).toBe('exact');
    expect(matchGearToTarget('PD', target, gear({ manufacturedOn: '2019-12-31' }))).toBe('exact');
    expect(matchGearToTarget('PD', target, gear({ manufacturedOn: '2020-01-01' }))).toBeNull();
    expect(matchGearToTarget('PD', target, gear({ manufacturedOn: null }))).toBe('needs_review');
  });

  test('a clearly outside serial wins over an unknown date: it is not a match', () => {
    expect(
      matchGearToTarget(
        'PD',
        { serialFrom: '1', serialTo: '10', manufacturedFrom: '2018-01-01' },
        gear({ serial: '999', manufacturedOn: null }),
      ),
    ).toBeNull();
  });

  test('every condition must hold', () => {
    const target = { model: 'VR360', serialFrom: '10000', serialTo: '11000', manufacturedFrom: '2020-01-01' };

    expect(matchGearToTarget('PD', target, gear())).toBe('exact');
    expect(matchGearToTarget('PD', target, gear({ manufacturedOn: '2019-12-31' }))).toBeNull();
  });
});

describe('matchGearToBulletin', () => {
  const bulletin: BulletinDefinition = {
    manufacturer: 'PD',
    targets: [{ model: 'VR360', serialFrom: '10000', serialTo: '11000' }, { model: 'Techno' }],
  };

  test('matches when any target matches', () => {
    expect(matchGearToBulletin(bulletin, gear())).toBe('exact');
    expect(matchGearToBulletin(bulletin, gear({ model: 'Techno 155', serial: null }))).toBeNull();
    expect(matchGearToBulletin(bulletin, gear({ model: 'Techno' }))).toBe('exact');
    expect(matchGearToBulletin(bulletin, gear({ serial: '500' }))).toBeNull();
  });

  test('exact beats needs review when two targets disagree', () => {
    expect(matchGearToBulletin(bulletin, gear({ model: 'Techno', serial: 'X-1' }))).toBe('exact');
    expect(matchGearToBulletin(bulletin, gear({ serial: 'X-1' }))).toBe('needs_review');
  });

  test('a bulletin with no targets applies to the whole manufacturer', () => {
    expect(matchGearToBulletin({ manufacturer: 'PD', targets: [] }, gear())).toBe('exact');
    expect(matchGearToBulletin({ manufacturer: 'Icarus', targets: [] }, gear())).toBeNull();
  });
});
