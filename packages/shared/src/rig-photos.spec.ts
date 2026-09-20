import type { GroundingView } from './bulletins';
import type { MaintenanceEntryView } from './gear';
import {
  buildRigTimeline,
  filterTimeline,
  RIG_PHOTO_MAX_BYTES,
  RIG_PHOTO_MAX_PER_RIG,
  type RigPhotoView,
} from './rig-photos';

function entry(overrides: Partial<MaintenanceEntryView> = {}): MaintenanceEntryView {
  return {
    id: 'e1',
    gearItemId: 'reserve-1',
    kind: 'repack',
    result: null,
    performedOn: '2026-09-10',
    description: 'Repack',
    performedById: 'r1',
    performedByName: 'Eca Rigger',
    performedByLicence: null,
    performedByContact: null,
    ownerReported: false,
    verifiedAt: null,
    verifiedById: null,
    voidedAt: null,
    voidReason: null,
    createdAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

function photo(overrides: Partial<RigPhotoView> = {}): RigPhotoView {
  return {
    id: 'p1',
    rigId: 'rig-1',
    entryId: null,
    fileName: 'rig.jpg',
    sizeBytes: 1000,
    caption: '',
    addedById: 'r1',
    addedByName: 'Eca Rigger',
    createdAt: '2026-09-12T10:00:00.000Z',
    ...overrides,
  };
}

function grounding(overrides: Partial<GroundingView> = {}): GroundingView {
  return {
    id: 'g1',
    rigId: 'rig-1',
    gearItemId: null,
    reason: 'Frayed handle',
    source: 'manual',
    bulletinMatchId: null,
    openedByName: 'Eca Rigger',
    openedAt: '2026-09-05T10:00:00.000Z',
    closedByName: null,
    closedAt: null,
    closeNote: null,
    ...overrides,
  };
}

const labels = { 'reserve-1': 'Reserve PD VR360', 'aad-1': 'AAD Vigil 4' };
const base = {
  entries: [] as MaintenanceEntryView[],
  groundings: [] as GroundingView[],
  photos: [] as RigPhotoView[],
  sheets: [],
  itemLabels: labels,
};

describe('rig photo limits', () => {
  test('a photo can be up to 8 MB and a rig can hold 20', () => {
    expect(RIG_PHOTO_MAX_BYTES).toBe(8 * 1024 * 1024);
    expect(RIG_PHOTO_MAX_PER_RIG).toBe(20);
  });
});

describe('buildRigTimeline', () => {
  test('merges work, groundings and photos, newest first', () => {
    const events = buildRigTimeline({
      ...base,
      entries: [entry({ id: 'old', performedOn: '2026-01-05' }), entry({ id: 'new', performedOn: '2026-09-10' })],
      groundings: [grounding({ closedAt: '2026-09-06T10:00:00.000Z', closedByName: 'Eca', closeNote: 'Replaced' })],
      photos: [photo({ id: 'pic', createdAt: '2026-09-12T10:00:00.000Z' })],
    });

    expect(events.map((e) => `${e.type}:${e.id}`)).toEqual([
      'photo:pic',
      'work:new',
      'grounding:g1-cleared',
      'grounding:g1-opened',
      'work:old',
    ]);
  });

  test('a work event carries its component, and the sheet that recorded a repack', () => {
    const [event] = buildRigTimeline({
      ...base,
      entries: [entry({ id: 'e1' })],
      sheets: [{ id: 'sheet-1', entryId: 'e1', sheetNo: 7 }],
    });

    expect(event).toMatchObject({
      type: 'work',
      category: 'repack',
      componentLabel: 'Reserve PD VR360',
      sheet: { id: 'sheet-1', sheetNo: 7 },
    });
  });

  test('a work event with no sheet has none', () => {
    const [event] = buildRigTimeline({ ...base, entries: [entry({ kind: 'aad_service', gearItemId: 'aad-1' })] });

    expect(event).toMatchObject({ category: 'service', componentLabel: 'AAD Vigil 4', sheet: null });
  });

  test('a photo linked to an entry sits under it and is not its own event', () => {
    const events = buildRigTimeline({
      ...base,
      entries: [entry({ id: 'e1' })],
      photos: [photo({ id: 'linked', entryId: 'e1' }), photo({ id: 'loose' })],
    });

    expect(events.map((e) => `${e.type}:${e.id}`)).toEqual(['photo:loose', 'work:e1']);
    const work = events.find((e) => e.type === 'work');
    expect(work && 'photos' in work ? work.photos.map((p) => p.id) : []).toEqual(['linked']);
  });

  test('a photo linked to an entry that is not in the list stands on its own', () => {
    const events = buildRigTimeline({ ...base, photos: [photo({ id: 'orphan', entryId: 'gone' })] });

    expect(events.map((e) => e.id)).toEqual(['orphan']);
  });

  test('an open grounding has only an opened event; a cleared one has both', () => {
    const open = buildRigTimeline({ ...base, groundings: [grounding()] });
    const cleared = buildRigTimeline({
      ...base,
      groundings: [grounding({ closedAt: '2026-09-06T10:00:00.000Z', closedByName: 'Eca', closeNote: 'Replaced' })],
    });

    expect(open.map((e) => e.id)).toEqual(['g1-opened']);
    expect(cleared.map((e) => e.id)).toEqual(['g1-cleared', 'g1-opened']);
    expect(cleared[0]).toMatchObject({ phase: 'cleared' });
  });

  test('on the same day the later record comes first', () => {
    const events = buildRigTimeline({
      ...base,
      entries: [
        entry({ id: 'morning', createdAt: '2026-09-10T08:00:00.000Z' }),
        entry({ id: 'evening', createdAt: '2026-09-10T18:00:00.000Z' }),
      ],
    });

    expect(events.map((e) => e.id)).toEqual(['evening', 'morning']);
  });

  test('a void entry stays in the timeline', () => {
    const [event] = buildRigTimeline({
      ...base,
      entries: [entry({ voidedAt: '2026-09-11T00:00:00.000Z', voidReason: 'x' })],
    });

    expect(event).toMatchObject({ type: 'work', entry: { voidReason: 'x' } });
  });
});

describe('filterTimeline', () => {
  const events = buildRigTimeline({
    ...base,
    entries: [
      entry({ id: 'repack' }),
      entry({ id: 'service', kind: 'aad_service', gearItemId: 'aad-1' }),
      entry({ id: 'reline', kind: 'reline' }),
      entry({ id: 'inspection', kind: 'inspection', result: 'passed' }),
      entry({ id: 'assembly', kind: 'assembly' }),
      entry({ id: 'withphoto' }),
    ],
    groundings: [grounding()],
    photos: [photo({ id: 'loose' }), photo({ id: 'linked', entryId: 'withphoto' })],
  });
  const ids = (category: Parameters<typeof filterTimeline>[1]) =>
    filterTimeline(events, category)
      .map((e) => e.id)
      .sort();

  test('everything when there is no filter', () => {
    expect(filterTimeline(events, null)).toHaveLength(events.length);
  });

  test.each([
    ['repack', ['repack', 'withphoto']],
    ['service', ['reline', 'service']],
    ['inspection', ['inspection']],
    ['other', ['assembly']],
    ['grounding', ['g1-opened']],
  ] as const)('%s', (category, expected) => {
    expect(ids(category)).toEqual([...expected].sort());
  });

  test('photos are the loose ones and the work that has one', () => {
    expect(ids('photo')).toEqual(['loose', 'withphoto']);
  });
});
