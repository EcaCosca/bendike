import type { DueItem } from '@bendike/shared';
import { describeDays, mostUrgentDue, STATUS_META } from './gear-status';

function due(kind: DueItem['kind'], dueOn: string | null, daysLeft: number | null, status: DueItem['status']): DueItem {
  return { kind, dueOn, daysLeft, status };
}

describe('STATUS_META', () => {
  test('gives every status a colour, a word and an icon name so colour is never the only signal', () => {
    expect(STATUS_META.overdue).toMatchObject({ color: 'error', label: 'Overdue' });
    expect(STATUS_META.due_soon).toMatchObject({ color: 'warning', label: 'Due soon' });
    expect(STATUS_META.ok).toMatchObject({ color: 'success', label: 'OK' });
    expect(STATUS_META.no_data).toMatchObject({ color: 'default', label: 'No data' });
    for (const meta of Object.values(STATUS_META)) {
      expect(meta.icon).toBeTruthy();
    }
  });
});

describe('describeDays', () => {
  test.each([
    [0, 'today'],
    [1, 'tomorrow'],
    [53, 'in 53 days'],
    [-1, 'yesterday'],
    [-22, '22 days overdue'],
  ])('%d is %s', (days, expected) => {
    expect(describeDays(days)).toBe(expected);
  });
});

describe('mostUrgentDue', () => {
  test('picks the worst status, then the earliest date', () => {
    const dues = [
      due('expiry', '2041-10-01', 5491, 'ok'),
      due('service', '2026-12-01', 73, 'due_soon'),
      due('battery', '2026-10-20', 31, 'due_soon'),
    ];

    expect(mostUrgentDue(dues)?.kind).toBe('battery');
  });

  test('an overdue date beats a due soon one, and no dues gives none', () => {
    expect(
      mostUrgentDue([due('repack', '2026-10-01', 12, 'due_soon'), due('expiry', '2026-01-01', -261, 'overdue')])?.kind,
    ).toBe('expiry');
    expect(mostUrgentDue([])).toBeNull();
  });

  test('a missing date ranks between due soon and ok', () => {
    expect(mostUrgentDue([due('expiry', '2041-10-01', 5000, 'ok'), due('battery', null, null, 'no_data')])?.kind).toBe(
      'battery',
    );
  });
});
