import {
  PACKING_CHECKLIST,
  PACKING_CHECKLIST_VERSION,
  describeProblem,
  missingItems,
  sanitizeCheckedIds,
  sheetProblems,
  signingBlockers,
  type PackingElements,
} from './packing-sheets';

const allIds = PACKING_CHECKLIST.map((item) => item.id);
const element = (kind: 'reserve' | 'container' | 'aad') => ({
  kind,
  manufacturer: 'UPT Vector',
  model: 'Sigma',
  serial: '1',
  manufacturedOn: null,
});
const fullRig: PackingElements = { reserve: element('reserve'), container: element('container'), aad: element('aad') };

const complete = {
  checkedIds: allIds,
  bulletinsChecked: true,
  mardConnected: true,
  elements: fullRig,
  notes: '',
  riggerLicence: 'AR-1234',
  performedOn: '2026-09-20',
  today: '2026-09-20',
};

describe('PACKING_CHECKLIST', () => {
  test('is the 36 items of the CIAC/ANAC form, 18 in each column, under a version', () => {
    expect(PACKING_CHECKLIST_VERSION).toBe('ciac-anac-1');
    expect(PACKING_CHECKLIST).toHaveLength(36);
    expect(PACKING_CHECKLIST.filter((item) => item.column === 'left')).toHaveLength(18);
    expect(PACKING_CHECKLIST.filter((item) => item.column === 'right')).toHaveLength(18);
  });

  test('every item has a unique id and a label in English and Spanish', () => {
    expect(new Set(allIds).size).toBe(36);
    for (const item of PACKING_CHECKLIST) {
      expect(item.en.trim()).not.toBe('');
      expect(item.es.trim()).not.toBe('');
    }
  });

  test('keeps the paper form order, the MARD line among the right column items', () => {
    const right = PACKING_CHECKLIST.filter((item) => item.column === 'right').map((item) => item.id);
    expect(right).toContain('mard_hooked');
    expect(right.indexOf('reserve_pin_seal')).toBeLessThan(right.indexOf('mard_hooked'));
    expect(right.at(-1)).toBe('logbook');
  });
});

describe('sanitizeCheckedIds', () => {
  test('keeps known ids once, in the form order, and drops the rest', () => {
    expect(sanitizeCheckedIds(['logbook', 'nonsense', 'main_lift_web', 'logbook'])).toEqual([
      'main_lift_web',
      'logbook',
    ]);
  });
});

describe('missingItems', () => {
  test('lists the items that are not ticked, in the form order', () => {
    const missing = missingItems(allIds.filter((id) => id !== 'mard_hooked' && id !== 'risers'));

    expect(missing.map((item) => item.id)).toEqual(['risers', 'mard_hooked']);
  });

  test('is empty when everything is ticked', () => {
    expect(missingItems(allIds)).toEqual([]);
  });
});

describe('sheetProblems', () => {
  test('is empty for a complete rig, ticked, with both answers yes', () => {
    expect(sheetProblems(complete)).toEqual([]);
  });

  test('reports each unticked item, a no to either question, and each component the rig lacks', () => {
    const problems = sheetProblems({
      ...complete,
      checkedIds: allIds.filter((id) => id !== 'mard_hooked'),
      bulletinsChecked: false,
      mardConnected: false,
      elements: { ...fullRig, aad: null, container: null },
    });

    expect(problems).toEqual([
      { code: 'item_unticked', itemId: 'mard_hooked' },
      { code: 'bulletins_not_checked' },
      { code: 'mard_not_connected' },
      { code: 'no_container' },
      { code: 'no_aad' },
    ]);
  });

  test('an unanswered question is a blocker to fix, not a problem to explain', () => {
    expect(sheetProblems({ ...complete, bulletinsChecked: null, mardConnected: null })).toEqual([]);
  });
});

describe('describeProblem', () => {
  test.each([
    [{ code: 'item_unticked', itemId: 'mard_hooked' }, 'Not ticked: MARD hooked up'],
    [{ code: 'bulletins_not_checked' }, 'Service bulletins not checked'],
    [{ code: 'mard_not_connected' }, 'MARD not connected'],
    [{ code: 'no_container' }, 'No container on the rig'],
    [{ code: 'no_aad' }, 'No AAD on the rig'],
    [{ code: 'no_reserve' }, 'No reserve on the rig'],
  ] as const)('%j reads %s', (problem, text) => {
    expect(describeProblem(problem)).toBe(text);
  });
});

describe('signingBlockers', () => {
  test('a complete sheet has none', () => {
    expect(signingBlockers(complete)).toEqual([]);
  });

  test('both questions must be answered', () => {
    expect(signingBlockers({ ...complete, bulletinsChecked: null })).toEqual([
      'Say whether the service bulletins were checked',
    ]);
    expect(signingBlockers({ ...complete, mardConnected: null })).toEqual(['Say whether the MARD is connected']);
  });

  test('the licence number is needed', () => {
    expect(signingBlockers({ ...complete, riggerLicence: '  ' })).toEqual(["Enter the rigger's licence number"]);
  });

  test('the work cannot be dated in the future', () => {
    expect(signingBlockers({ ...complete, performedOn: '2026-09-21' })).toEqual([
      'The work cannot be dated in the future',
    ]);
  });

  test('anything missing needs notes that explain it', () => {
    const missingMard = { ...complete, checkedIds: allIds.filter((id) => id !== 'mard_hooked'), mardConnected: false };

    expect(signingBlockers(missingMard)).toEqual(['The notes must explain what is missing: 2 items to explain']);
    expect(signingBlockers({ ...missingMard, notes: '   ' })).toHaveLength(1);
    expect(signingBlockers({ ...missingMard, notes: 'No MARD on this unit' })).toEqual([]);
  });

  test('counts a single problem in the singular', () => {
    expect(signingBlockers({ ...complete, checkedIds: allIds.slice(1) })).toEqual([
      'The notes must explain what is missing: 1 item to explain',
    ]);
  });
});
