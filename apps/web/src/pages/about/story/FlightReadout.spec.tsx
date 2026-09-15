import { glideRatio, sampleAt, type FlightTrack } from './flight-track';

const track: FlightTrack = {
  source: 'test',
  durationS: 10,
  samples: [
    { t: 0, alt: 3000, hs: 100, vs: 20 },
    { t: 5, alt: 2800, hs: 200, vs: 40 },
    { t: 10, alt: 2500, hs: 250, vs: 30 },
  ],
};

describe('sampleAt', () => {
  test('clamps before the first and after the last sample', () => {
    expect(sampleAt(track, -1)).toEqual(track.samples[0]);
    expect(sampleAt(track, 99)).toEqual(track.samples[2]);
  });

  test('interpolates linearly between samples', () => {
    expect(sampleAt(track, 2.5)).toEqual({ t: 2.5, alt: 2900, hs: 150, vs: 30 });
  });

  test('returns null for an empty track', () => {
    expect(sampleAt({ ...track, samples: [] }, 1)).toBeNull();
  });
});

describe('glideRatio', () => {
  test('divides horizontal speed in m/s by descent rate', () => {
    expect(glideRatio({ t: 0, alt: 0, hs: 180, vs: 20 })).toBeCloseTo(2.5);
  });

  test('is zero when the descent rate is negligible', () => {
    expect(glideRatio({ t: 0, alt: 0, hs: 180, vs: 0.2 })).toBe(0);
  });
});
