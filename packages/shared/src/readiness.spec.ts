import { describeReason } from './readiness';
import type { ReadinessReason } from './gear';

describe('describeReason', () => {
  test('work awaiting verification counts the entries', () => {
    const reason: ReadinessReason = {
      type: 'pending_verification',
      entries: [
        {
          entryId: 'a',
          gearItemId: 'g',
          kind: 'repack',
          performedOn: '2026-09-10',
          performedByName: 'X',
          performedByContact: null,
        },
        {
          entryId: 'b',
          gearItemId: 'g',
          kind: 'repair',
          performedOn: '2026-09-11',
          performedByName: 'Y',
          performedByContact: null,
        },
      ],
    };

    expect(describeReason(reason)).toBe('Work awaiting verification (2)');
  });

  test('a failed inspection says when and what was found', () => {
    const reason: ReadinessReason = {
      type: 'inspection_grounded',
      inspection: {
        entryId: 'i',
        gearItemId: 'g',
        performedOn: '2026-09-15',
        result: 'grounded',
        performedByName: 'Eca',
        description: 'Cracked handle',
      },
    };

    expect(describeReason(reason)).toBe('Grounded at an inspection on 2026-09-15: Cracked handle');
  });

  test('a grounding a rigger opened says who and why, and a bulletin grounding is the bulletin text', () => {
    const base = {
      id: 'g1',
      rigId: 'r',
      gearItemId: null,
      bulletinMatchId: null,
      openedByName: 'Eca',
      openedAt: '2026-09-15T10:00:00.000Z',
      closedByName: null,
      closedAt: null,
      closeNote: null,
    };

    expect(
      describeReason({ type: 'grounding', grounding: { ...base, reason: 'Frayed handle', source: 'manual' } }),
    ).toBe('Grounded by Eca: Frayed handle');
    expect(
      describeReason({
        type: 'grounding',
        grounding: { ...base, reason: 'Bulletin SB-1 (PD): Slider check', source: 'bulletin' },
      }),
    ).toBe('Bulletin SB-1 (PD): Slider check');
  });
});
