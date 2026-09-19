import { isStale } from './staleness';

describe('isStale', () => {
  const now = new Date('2026-09-17T12:00:00Z');

  test('a missing fetch date is stale', () => {
    expect(isStale(null, now)).toBe(true);
  });

  test('a rate fetched under 24 hours ago is not stale', () => {
    expect(isStale(new Date('2026-09-17T00:00:01Z'), now)).toBe(false);
  });

  test('a rate fetched exactly 24 hours ago is not stale', () => {
    expect(isStale(new Date('2026-09-16T12:00:00Z'), now)).toBe(false);
  });

  test('a rate fetched more than 24 hours ago is stale', () => {
    expect(isStale(new Date('2026-09-16T11:59:59Z'), now)).toBe(true);
  });
});
