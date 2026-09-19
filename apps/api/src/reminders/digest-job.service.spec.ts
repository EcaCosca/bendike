import { Role } from '@bendike/shared';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { User } from '../users/user.entity';
import { buildUser } from '../users/user.factory';
import type { Digest, DigestItem } from './digest';
import { DigestDelivery } from './digest-delivery.entity';
import { DigestJobService } from './digest-job.service';
import { RiggerSettings } from './rigger-settings.entity';

const TODAY = '2026-09-19';

function digestFor(riggerId: string, email: string, items: DigestItem[]): Digest {
  return { rigger: { id: riggerId, displayName: 'R', email, locale: 'en' }, items };
}

function item(subjectId: string, section: 'overdue' | 'due_soon' | 'verification' = 'overdue'): DigestItem {
  return {
    key: {
      subjectId,
      kind: section === 'verification' ? 'verification' : 'repack',
      dueKey: section === 'verification' ? 'none' : '2026-08-28',
    },
    section,
    status: section === 'verification' ? 'pending' : section,
    ownerName: 'Salta',
    ownerPhone: null,
    ownerEmail: 'dz@bendike.example',
    rigName: 'Micro 3',
    componentLabel: 'PD VR360',
    dueKind: section === 'verification' ? null : 'repack',
    dueOn: section === 'verification' ? null : '2026-08-28',
    daysLeft: -22,
    contactUrl: null,
  };
}

describe('DigestJobService', () => {
  let manager: InMemoryManager;
  const riggerA = buildUser({ role: Role.Rigger, email: 'a@bendike.example' });
  const riggerB = buildUser({ role: Role.Rigger, email: 'b@bendike.example' });
  const admin = buildUser({ role: Role.Admin });
  let sender: { send: jest.Mock };
  let builder: { build: jest.Mock };

  function service() {
    return new DigestJobService(manager as never, builder as never, sender, { today: () => TODAY }, {
      webBaseUrl: 'https://bendike.example',
    } as never);
  }

  beforeEach(() => {
    manager = new InMemoryManager();
    for (const user of [riggerA, riggerB, admin]) manager.seed(User, user);
    sender = { send: jest.fn().mockResolvedValue(undefined) };
    builder = {
      build: jest.fn((rigger: User) =>
        Promise.resolve(
          digestFor(rigger.id, rigger.email, [item(`item-${rigger.id}`), item(`e-${rigger.id}`, 'verification')]),
        ),
      ),
    };
  });

  test('sends one digest per rigger with something to report, to the rigger email', async () => {
    const report = await service().run({ dryRun: false });

    expect(sender.send).toHaveBeenCalledTimes(2);
    expect(sender.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@bendike.example', subject: expect.stringContaining('Bendike') }),
    );
    expect(report).toMatchObject({ dryRun: false, today: TODAY });
    expect(report.sent.map((s) => s.riggerEmail).sort()).toEqual(['a@bendike.example', 'b@bendike.example']);
    expect(report.failed).toEqual([]);
  });

  test('records each reported item so the same day never sends twice', async () => {
    await service().run({ dryRun: false });

    const deliveries = await manager.find(DigestDelivery, {});
    expect(deliveries).toHaveLength(4);
    expect(deliveries.find((d) => d.subjectId === `item-${riggerA.id}`)).toMatchObject({
      riggerId: riggerA.id,
      kind: 'repack',
      dueKey: '2026-08-28',
      lastStatus: 'overdue',
      sentOn: TODAY,
      timesSent: 1,
    });
    expect(deliveries.find((d) => d.subjectId === `e-${riggerA.id}`)).toMatchObject({
      kind: 'verification',
      dueKey: 'none',
      lastStatus: 'pending',
    });
  });

  test('hands the builder the deliveries already recorded, and counts repeat sends', async () => {
    await service().run({ dryRun: false });
    builder.build.mockClear();

    await service().run({ dryRun: false });

    const passed = builder.build.mock.calls[0]?.[1] as DigestDelivery[];
    expect(passed.length).toBeGreaterThan(0);
    expect((await manager.find(DigestDelivery, {})).every((d) => d.timesSent === 2)).toBe(true);
  });

  test('a dry run reports what it would send and sends and records nothing', async () => {
    const report = await service().run({ dryRun: true });

    expect(sender.send).not.toHaveBeenCalled();
    expect(await manager.count(DigestDelivery)).toBe(0);
    expect(report.dryRun).toBe(true);
    expect(report.sent).toHaveLength(2);
    expect(report.sent[0]).toMatchObject({ itemCount: 2, subject: expect.any(String), text: expect.any(String) });
  });

  test('a rigger who turned the digest off is skipped', async () => {
    manager.seed(RiggerSettings, { riggerId: riggerB.id, digestEnabled: false });

    const report = await service().run({ dryRun: false });

    expect(report.sent.map((s) => s.riggerEmail)).toEqual(['a@bendike.example']);
    expect(report.skipped).toBe(1);
  });

  test('a rigger with nothing to report gets no email', async () => {
    builder.build.mockImplementation((rigger: User) =>
      Promise.resolve(rigger.id === riggerA.id ? null : digestFor(rigger.id, rigger.email, [item('x')])),
    );

    const report = await service().run({ dryRun: false });

    expect(sender.send).toHaveBeenCalledTimes(1);
    expect(report.skipped).toBe(1);
  });

  test('a failing provider does not stop the others and is retried next run: nothing is recorded for the failed rigger', async () => {
    sender.send.mockImplementation((message: { to: string }) =>
      message.to === 'a@bendike.example' ? Promise.reject(new Error('domain is not verified')) : Promise.resolve(),
    );

    const report = await service().run({ dryRun: false });

    expect(report.failed).toEqual([{ riggerEmail: 'a@bendike.example', error: 'domain is not verified' }]);
    expect(report.sent.map((s) => s.riggerEmail)).toEqual(['b@bendike.example']);
    const deliveries = await manager.find(DigestDelivery, {});
    expect(deliveries.every((d) => d.riggerId === riggerB.id)).toBe(true);
  });

  test('can be limited to one rigger', async () => {
    const report = await service().run({ dryRun: true, riggerId: riggerA.id });

    expect(report.sent.map((s) => s.riggerEmail)).toEqual(['a@bendike.example']);
  });
});
