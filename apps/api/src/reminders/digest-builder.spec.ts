import {
  Role,
  type BulletinMatchView,
  type GroundedRigRow,
  type VerificationRow,
  type WorkItem,
  type WorkItemOwner,
} from '@bendike/shared';
import { buildUser } from '../users/user.factory';
import { DigestBuilder } from './digest-builder';
import type { DigestDelivery } from './digest-delivery.entity';

const TODAY = '2026-09-19';
const rigger = buildUser({ role: Role.Rigger, displayName: 'Eca', email: 'eca@bendike.example', locale: 'es' });

const salta: WorkItemOwner = {
  id: 'o1',
  displayName: 'Salta en Rosario',
  role: Role.Dropzone,
  phone: '+5493415550002',
  email: 'dz@bendike.example',
  locale: 'es',
};
const ana: WorkItemOwner = {
  id: 'o2',
  displayName: 'Ana',
  role: Role.User,
  phone: null,
  email: 'ana@bendike.example',
  locale: 'en',
};

function work(id: string, overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: `${id}:repack`,
    owner: salta,
    rig: { id: 'r1', name: 'Micro 3', grounded: false },
    item: { id, kind: 'reserve', manufacturer: 'PD', model: 'VR360', serial: '1' },
    dueKind: 'repack',
    dueOn: '2026-08-28',
    daysLeft: -22,
    status: 'overdue',
    ...overrides,
  };
}

function verification(entryId: string): VerificationRow {
  return {
    entryId,
    owner: ana,
    rig: { id: 'r2', name: 'Ana rig' },
    item: { id: 'i9', kind: 'reserve', manufacturer: 'PD', model: 'Reserve' },
    kind: 'repack',
    performedOn: '2026-09-12',
    performedByName: 'Carlos Packer',
    performedByContact: '+54 9 341 555 0000',
  };
}

function delivery(subjectId: string, kind: string, dueKey: string, sentOn: string, lastStatus: string): DigestDelivery {
  return { id: `d-${subjectId}`, riggerId: rigger.id, subjectId, kind, dueKey, sentOn, lastStatus, timesSent: 1 };
}

function builder(
  items: WorkItem[],
  verifications: VerificationRow[] = [],
  groundedRigs: GroundedRigRow[] = [],
  matches: BulletinMatchView[] = [],
) {
  return new DigestBuilder(
    {
      collect: () =>
        Promise.resolve({
          items,
          verifications,
          groundedRigs,
          counts: { overdue: 0, due_soon: 0, no_data: 0, awaitingVerification: 0, grounded: 0 },
          owners: [],
        }),
    },
    { list: () => Promise.resolve(matches) },
  );
}

function bulletinMatch(id: string, overrides: Partial<BulletinMatchView> = {}): BulletinMatchView {
  return {
    id,
    bulletin: {
      id: 'b1',
      manufacturer: 'PD',
      reference: 'SB-1',
      title: 'Slider check',
      severity: 'mandatory',
      requiredAction: 'Inspect the slider',
      sourceUrl: null,
    },
    confidence: 'exact',
    status: 'open',
    resolutionNote: null,
    resolvedAt: null,
    owner: { id: 'o1', displayName: 'Salta en Rosario' },
    rig: { id: 'r1', name: 'Micro 3' },
    item: { id: 'i1', kind: 'reserve', manufacturer: 'PD', model: 'VR360', serial: '1' },
    ...overrides,
  };
}

describe('DigestBuilder', () => {
  test('lists what is overdue and what is due soon, most urgent first, leaving out what is fine or unknown', async () => {
    const digest = await builder([
      work('ok', { status: 'ok', daysLeft: 120, dueOn: '2027-01-17' }),
      work('soon', { status: 'due_soon', daysLeft: 10, dueOn: '2026-09-29' }),
      work('unknown', { status: 'no_data', dueOn: null, daysLeft: null }),
      work('late', { status: 'overdue' }),
    ]).build(rigger, [], TODAY);

    expect(digest?.items.map((i) => [i.section, i.key.subjectId])).toEqual([
      ['overdue', 'late'],
      ['due_soon', 'soon'],
    ]);
  });

  test('sends nothing when there is nothing to report', async () => {
    expect(
      await builder([work('ok', { status: 'ok', daysLeft: 200, dueOn: '2027-04-01' })]).build(rigger, [], TODAY),
    ).toBeNull();
    expect(await builder([]).build(rigger, [], TODAY)).toBeNull();
  });

  test('each row carries the owner and a contact link written in the owner language by the rigger', async () => {
    const digest = await builder([
      work('late'),
      work('ana-late', {
        owner: ana,
        rig: { id: 'r2', name: 'Ana rig', grounded: false },
        item: { id: 'a1', kind: 'reserve', manufacturer: 'PD', model: 'X', serial: null },
      }),
    ]).build(rigger, [], TODAY);

    const salta = digest?.items.find((i) => i.key.subjectId === 'late');
    expect(salta).toMatchObject({
      ownerName: 'Salta en Rosario',
      ownerPhone: '+5493415550002',
      rigName: 'Micro 3',
      componentLabel: 'PD VR360',
    });
    expect(salta?.contactUrl).toMatch(/^https:\/\/wa\.me\/5493415550002\?text=/);
    expect(decodeURIComponent(salta?.contactUrl ?? '')).toMatch(/Hola Salta en Rosario, soy Eca de Bendike/);
    const anaItem = digest?.items.find((i) => i.key.subjectId === 'a1');
    expect(anaItem?.contactUrl).toMatch(/^mailto:ana%40bendike\.example/);
    expect(decodeURIComponent(anaItem?.contactUrl ?? '')).toMatch(/Hi Ana, this is Eca from Bendike/);
  });

  test('an item reported recently is left out until its interval passes', async () => {
    const items = [work('late'), work('soon', { status: 'due_soon', daysLeft: 10, dueOn: '2026-09-29' })];
    const sent = [
      delivery('late', 'repack', '2026-08-28', '2026-09-17', 'overdue'),
      delivery('soon', 'repack', '2026-09-29', '2026-09-15', 'due_soon'),
    ];

    const digest = await builder(items).build(rigger, sent, TODAY);

    expect(digest).toBeNull();
    const later = await builder(items).build(rigger, sent, '2026-09-24');
    expect(later?.items.map((i) => i.key.subjectId)).toEqual(['late', 'soon']);
  });

  test('a renewed due date starts over, and the day it turns overdue it is reported again', async () => {
    const renewed = work('late', { dueOn: '2027-03-18', status: 'due_soon', daysLeft: 10 });
    expect(
      await builder([renewed]).build(
        rigger,
        [delivery('late', 'repack', '2026-08-28', '2026-09-18', 'overdue')],
        TODAY,
      ),
    ).not.toBeNull();

    const turned = await builder([work('late')]).build(
      rigger,
      [delivery('late', 'repack', '2026-08-28', '2026-09-18', 'due_soon')],
      TODAY,
    );
    expect(turned?.items).toHaveLength(1);
  });

  test('lists work an outside rigger did that still awaits verification, weekly', async () => {
    const digest = await builder([], [verification('e1')]).build(rigger, [], TODAY);

    expect(digest?.items).toEqual([
      expect.objectContaining({
        section: 'verification',
        status: 'pending',
        ownerName: 'Ana',
        rigName: 'Ana rig',
        verification: {
          kind: 'repack',
          performedOn: '2026-09-12',
          performedByName: 'Carlos Packer',
          performedByContact: '+54 9 341 555 0000',
        },
      }),
    ]);
    expect(
      await builder([], [verification('e1')]).build(
        rigger,
        [delivery('e1', 'verification', 'none', '2026-09-17', 'pending')],
        TODAY,
      ),
    ).toBeNull();
  });

  test('lists rigs grounded and waiting for the rigger to clear them, weekly', async () => {
    const grounded: GroundedRigRow = {
      rig: { id: 'r7', name: 'Fleet 9' },
      owner: { id: 'o1', displayName: 'Salta en Rosario' },
      reasons: ['Grounded by Eca: Frayed handle', 'Work awaiting verification (1)'],
    };

    const digest = await builder([], [], [grounded]).build(rigger, [], TODAY);

    expect(digest?.items).toEqual([
      expect.objectContaining({
        section: 'grounded',
        status: 'pending',
        key: { subjectId: 'r7', kind: 'grounded', dueKey: 'none' },
        ownerName: 'Salta en Rosario',
        rigName: 'Fleet 9',
        note: 'Grounded by Eca: Frayed handle; Work awaiting verification (1)',
      }),
    ]);
    expect(
      await builder([], [], [grounded]).build(
        rigger,
        [delivery('r7', 'grounded', 'none', '2026-09-17', 'pending')],
        TODAY,
      ),
    ).toBeNull();
  });

  test('lists open bulletin matches with what the bulletin asks for, and flags the ones to review', async () => {
    const digest = await builder(
      [],
      [],
      [],
      [bulletinMatch('m1'), bulletinMatch('m2', { confidence: 'needs_review' })],
    ).build(rigger, [], TODAY);

    expect(digest?.items.map((i) => [i.section, i.key.subjectId])).toEqual([
      ['bulletin', 'm1'],
      ['bulletin', 'm2'],
    ]);
    expect(digest?.items[0]?.note).toBe('SB-1 (mandatory): Slider check. Inspect the slider');
    expect(digest?.items[1]?.note).toContain('needs review');
    expect(digest?.items[0]).toMatchObject({
      ownerName: 'Salta en Rosario',
      rigName: 'Micro 3',
      componentLabel: 'PD VR360',
    });
  });

  test('sections come in a fixed order: overdue, due soon, grounded, bulletins, verification', async () => {
    const digest = await builder(
      [work('late')],
      [verification('e1')],
      [{ rig: { id: 'r7', name: 'Fleet 9' }, owner: { id: 'o1', displayName: 'Salta' }, reasons: ['x'] }],
      [bulletinMatch('m1')],
    ).build(rigger, [], TODAY);

    expect(digest?.items.map((i) => i.section)).toEqual(['overdue', 'grounded', 'bulletin', 'verification']);
  });

  test('identifies the rigger and their language for the renderer', async () => {
    const digest = await builder([work('late')]).build(rigger, [], TODAY);

    expect(digest?.rigger).toEqual({ id: rigger.id, displayName: 'Eca', email: 'eca@bendike.example', locale: 'es' });
  });
});
