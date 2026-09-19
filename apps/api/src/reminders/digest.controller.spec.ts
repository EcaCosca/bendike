import { Role } from '@bendike/shared';
import { buildUser } from '../users/user.factory';
import { AdminDigestController, DigestJobController, RiggerSettingsController } from './digest.controller';

describe('digest controllers', () => {
  const report = { dryRun: false, today: '2026-09-19', sent: [], skipped: 0, failed: [] };
  let job: { run: jest.Mock };
  let settings: { get: jest.Mock; update: jest.Mock };

  beforeEach(() => {
    job = { run: jest.fn().mockResolvedValue(report) };
    settings = {
      get: jest.fn().mockResolvedValue({ digestEnabled: true }),
      update: jest.fn().mockResolvedValue({ digestEnabled: false }),
    };
  });

  test('the scheduler route runs the real job', async () => {
    await new DigestJobController(job as never).run();

    expect(job.run).toHaveBeenCalledWith({ dryRun: false });
  });

  test('the admin route previews by default and only sends when dryRun=false is asked for', async () => {
    const controller = new AdminDigestController(job as never);

    await controller.run({});
    await controller.run({ dryRun: 'false', riggerId: 'r1' });

    expect(job.run).toHaveBeenNthCalledWith(1, { dryRun: true });
    expect(job.run).toHaveBeenNthCalledWith(2, { dryRun: false, riggerId: 'r1' });
  });

  test('a rigger reads and changes only their own digest setting', async () => {
    const rigger = buildUser({ role: Role.Rigger });
    const controller = new RiggerSettingsController(settings as never);

    await controller.get(rigger);
    await controller.update(rigger, { digestEnabled: false });

    expect(settings.get).toHaveBeenCalledWith(rigger.id);
    expect(settings.update).toHaveBeenCalledWith(rigger.id, { digestEnabled: false });
  });
});
