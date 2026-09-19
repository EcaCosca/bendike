import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { RiggerSettings } from './rigger-settings.entity';
import { RiggerSettingsService } from './rigger-settings.service';

describe('RiggerSettingsService', () => {
  let manager: InMemoryManager;
  let service: RiggerSettingsService;

  beforeEach(() => {
    manager = new InMemoryManager();
    service = new RiggerSettingsService(manager as never);
  });

  test('the digest is on for a rigger who never chose', async () => {
    expect(await service.get('r1')).toEqual({ digestEnabled: true });
    expect(await manager.count(RiggerSettings)).toBe(0);
  });

  test('turns it off and on again, keeping one row per rigger', async () => {
    expect(await service.update('r1', { digestEnabled: false })).toEqual({ digestEnabled: false });
    expect(await service.get('r1')).toEqual({ digestEnabled: false });
    expect(await service.update('r1', { digestEnabled: true })).toEqual({ digestEnabled: true });
    expect(await manager.count(RiggerSettings)).toBe(1);
  });

  test("one rigger's choice does not touch another's", async () => {
    await service.update('r1', { digestEnabled: false });

    expect(await service.get('r2')).toEqual({ digestEnabled: true });
  });
});
