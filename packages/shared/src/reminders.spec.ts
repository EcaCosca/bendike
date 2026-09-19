import { DIGEST_INTERVAL_DAYS, isDueForDigest } from './reminders';

const TODAY = '2026-09-19';

describe('isDueForDigest', () => {
  test('an item never reported is always included', () => {
    expect(isDueForDigest('due_soon', null, TODAY)).toBe(true);
    expect(isDueForDigest('overdue', null, TODAY)).toBe(true);
    expect(isDueForDigest('pending', null, TODAY)).toBe(true);
  });

  test('is never included twice on the same day, whatever changed', () => {
    expect(isDueForDigest('overdue', { sentOn: TODAY, status: 'overdue' }, TODAY)).toBe(false);
    expect(isDueForDigest('overdue', { sentOn: TODAY, status: 'due_soon' }, TODAY)).toBe(false);
  });

  test('a due soon item comes back weekly', () => {
    expect(isDueForDigest('due_soon', { sentOn: '2026-09-13', status: 'due_soon' }, TODAY)).toBe(false);
    expect(isDueForDigest('due_soon', { sentOn: '2026-09-12', status: 'due_soon' }, TODAY)).toBe(true);
    expect(isDueForDigest('due_soon', { sentOn: '2026-09-01', status: 'due_soon' }, TODAY)).toBe(true);
  });

  test('an overdue item comes back every three days', () => {
    expect(isDueForDigest('overdue', { sentOn: '2026-09-17', status: 'overdue' }, TODAY)).toBe(false);
    expect(isDueForDigest('overdue', { sentOn: '2026-09-16', status: 'overdue' }, TODAY)).toBe(true);
  });

  test('the day it becomes overdue it is reported even if it was reported yesterday as due soon', () => {
    expect(isDueForDigest('overdue', { sentOn: '2026-09-18', status: 'due_soon' }, TODAY)).toBe(true);
  });

  test('work awaiting the rigger comes back weekly', () => {
    expect(isDueForDigest('pending', { sentOn: '2026-09-15', status: 'pending' }, TODAY)).toBe(false);
    expect(isDueForDigest('pending', { sentOn: '2026-09-12', status: 'pending' }, TODAY)).toBe(true);
  });

  test('publishes the intervals', () => {
    expect(DIGEST_INTERVAL_DAYS).toEqual({ due_soon: 7, overdue: 3, pending: 7 });
  });
});
