import { ConflictException, NotFoundException } from '@nestjs/common';
import { GearModel } from './entities/gear-model.entity';
import { GearModelsService } from './gear-models.service';
import { InMemoryManager } from './testing/in-memory-manager';

describe('GearModelsService', () => {
  let manager: InMemoryManager;
  let service: GearModelsService;

  beforeEach(() => {
    manager = new InMemoryManager();
    service = new GearModelsService(manager as never);
  });

  test('creates a model with the rules it is given and none for the rest', async () => {
    const created = await service.create({
      kind: 'aad',
      manufacturer: 'Vigil',
      model: 'Cuatro',
      lifeYears: 20,
      serviceIntervalMonths: 120,
    });

    expect(created).toMatchObject({
      kind: 'aad',
      manufacturer: 'Vigil',
      model: 'Cuatro',
      lifeYears: 20,
      serviceIntervalMonths: 120,
      repackCycleDays: null,
      batteryCycleMonths: null,
      active: true,
    });
  });

  test('refuses the same kind, manufacturer and model ignoring case and spaces', async () => {
    await service.create({ kind: 'aad', manufacturer: 'Vigil', model: 'Cuatro' });

    await expect(service.create({ kind: 'aad', manufacturer: ' vigil ', model: 'CUATRO' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.create({ kind: 'reserve', manufacturer: 'Vigil', model: 'Cuatro' })).resolves.toBeDefined();
  });

  test('lists active models only, ordered by manufacturer and model, unless asked for all', async () => {
    await service.create({ kind: 'reserve', manufacturer: 'PD', model: 'VR360' });
    const old = await service.create({ kind: 'reserve', manufacturer: 'Aerodyne', model: 'Smart' });
    await service.update(old.id, { active: false });
    await service.create({ kind: 'aad', manufacturer: 'Airtec', model: 'Cypres' });

    expect((await service.list()).map((m) => m.model)).toEqual(['Cypres', 'VR360']);
    expect((await service.list(true)).map((m) => m.model)).toEqual(['Smart', 'Cypres', 'VR360']);
  });

  test('updates the rules and the name of a model', async () => {
    const created = await service.create({ kind: 'reserve', manufacturer: 'PD', model: 'VR360' });

    const updated = await service.update(created.id, { repackCycleDays: 120, model: 'VR 360' });

    expect(updated).toMatchObject({ repackCycleDays: 120, model: 'VR 360', manufacturer: 'PD' });
  });

  test('renaming a model onto another existing one is a conflict', async () => {
    await service.create({ kind: 'reserve', manufacturer: 'PD', model: 'VR360' });
    const other = await service.create({ kind: 'reserve', manufacturer: 'PD', model: 'PR143' });

    await expect(service.update(other.id, { model: 'vr360' })).rejects.toBeInstanceOf(ConflictException);
  });

  test('an unknown id is 404', async () => {
    await expect(service.update('00000000-0000-4000-8000-00000000ffff', { active: false })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  test('stores the rows as GearModel entities', async () => {
    await service.create({ kind: 'reserve', manufacturer: 'PD', model: 'VR360' });

    expect(await manager.count(GearModel)).toBe(1);
  });
});
