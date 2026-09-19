import { Role } from '@bendike/shared';
import { User } from '../../users/user.entity';
import { buildUser } from '../../users/user.factory';
import { AadDetail } from '../entities/details.entities';
import { GearItem } from '../entities/gear-item.entity';
import { MaintenanceEntry } from '../entities/maintenance-entry.entity';
import { Rig } from '../entities/rig.entity';
import { GearAccessService } from '../gear-access.service';
import { GearReadService } from '../gear-read.service';
import { GearService } from '../gear.service';
import { MaintenanceService } from '../maintenance.service';
import { noLinks, noRiggers } from '../testing/no-links';
import { InMemoryManager } from '../testing/in-memory-manager';
import type { FleetPlan, PlannedItem } from './fleet-plan';
import { FleetImporter } from './fleet-importer';

const TODAY = '2026-09-19';

function planned(overrides: Partial<PlannedItem>): PlannedItem {
  return {
    kind: 'reserve',
    manufacturer: 'PD',
    model: 'VR360',
    serial: '3001',
    manufacturedOn: '2020-09-01',
    notes: '',
    details: { sizeSqft: null, repackCycleDays: null, deployments: 0 },
    entries: [],
    ...overrides,
  };
}

function plan(): FleetPlan {
  return {
    rigs: [
      {
        name: 'Micro A',
        active: true,
        items: [
          planned({ entries: [{ kind: 'repack', performedOn: '2026-08-27', description: 'Repack recorded' }] }),
          planned({
            kind: 'aad',
            manufacturer: 'Vigil',
            model: 'Vigil 4',
            serial: '2001',
            details: {
              mode: null,
              batteryInstalledOn: null,
              batteryCycleMonths: null,
              serviceDueOn: '2031-10-01',
              expiresOn: '2041-10-01',
            },
          }),
        ],
      },
      { name: 'Viejo C', active: false, items: [] },
    ],
    spares: [
      planned({
        kind: 'container',
        manufacturer: 'UPT',
        model: 'Micro Sigma',
        serial: '1099',
        details: { harnessSize: null, tso: null },
      }),
    ],
    warnings: [],
  };
}

describe('FleetImporter', () => {
  let manager: InMemoryManager;
  let importer: FleetImporter;
  const admin = buildUser({ role: Role.Admin, displayName: 'Eca' });
  const dropzone = buildUser({ role: Role.Dropzone, displayName: 'Salta en Rosario' });

  beforeEach(() => {
    manager = new InMemoryManager();
    manager.seed(User, admin);
    manager.seed(User, dropzone);
    const access = new GearAccessService(noLinks);
    const clock = { today: () => TODAY };
    const read = new GearReadService(manager as never, access, clock, noRiggers);
    importer = new FleetImporter(
      manager as never,
      new GearService(manager as never, access, read, clock, {
        rematchItem: () => Promise.resolve({ matched: 0, groundings: 0 }),
      }),
      new MaintenanceService(manager as never, access, clock),
    );
  });

  test('creates the rigs, components and entries for the dropzone', async () => {
    const report = await importer.apply(admin, dropzone.id, plan());

    expect(report).toMatchObject({ rigsCreated: 2, itemsCreated: 3, entriesCreated: 1 });
    const rigs = await manager.find(Rig, { where: { ownerId: dropzone.id } });
    expect(rigs.map((r) => [r.name, r.active])).toEqual(
      expect.arrayContaining([
        ['Micro A', true],
        ['Viejo C', false],
      ]),
    );
    const items = await manager.find(GearItem, { where: { ownerId: dropzone.id } });
    expect(items).toHaveLength(3);
    expect(items.filter((i) => i.rigId === null).map((i) => i.model)).toEqual(['Micro Sigma']);
  });

  test('the imported repack is signed off, not owner-reported, so it does not ground the rig', async () => {
    await importer.apply(admin, dropzone.id, plan());

    const repacks = (await manager.find(MaintenanceEntry, {})).filter((e) => e.kind === 'repack');
    expect(repacks).toHaveLength(1);
    expect(repacks[0]).toMatchObject({ ownerReported: false, performedOn: '2026-08-27', performedById: admin.id });
  });

  test("keeps the AAD's typed dates", async () => {
    await importer.apply(admin, dropzone.id, plan());

    const details = await manager.find(AadDetail, {});
    expect(details[0]).toMatchObject({ serviceDueOn: '2031-10-01', expiresOn: '2041-10-01' });
  });

  test('a service entry from the sheet leaves no pending service date', async () => {
    const withService = plan();
    const aad = withService.rigs[0]?.items[1];
    if (!aad) throw new Error('missing');
    aad.details = { ...aad.details, serviceDueOn: null };
    aad.entries = [{ kind: 'aad_service', performedOn: '2025-04-01', description: 'Service recorded' }];

    await importer.apply(admin, dropzone.id, withService);

    expect((await manager.find(AadDetail, {}))[0]?.serviceDueOn).toBeNull();
  });

  test('running it twice creates nothing new', async () => {
    await importer.apply(admin, dropzone.id, plan());

    const second = await importer.apply(admin, dropzone.id, plan());

    expect(second).toMatchObject({
      rigsCreated: 0,
      itemsCreated: 0,
      entriesCreated: 0,
      rigsSkipped: 2,
      itemsSkipped: 3,
    });
    expect(await manager.count(GearItem)).toBe(3);
  });

  test('a component already in another place is skipped with a warning instead of failing', async () => {
    await importer.apply(admin, dropzone.id, plan());
    const again = plan();
    again.rigs[0]?.items.push(planned({ model: 'Other', serial: '9', kind: 'reserve' }));

    const report = await importer.apply(admin, dropzone.id, again);

    expect(report.itemsCreated).toBe(0);
    expect(report.warnings.some((w) => w.includes('Micro A'))).toBe(true);
  });

  test('components with no serial that differ only by colour are all imported', async () => {
    const twins = plan();
    twins.spares = [
      planned({
        kind: 'main',
        manufacturer: 'PD',
        model: 'Sigma 2',
        serial: null,
        notes: 'Tandem, Verde/Azul',
        details: { sizeSqft: 340, lineType: null },
      }),
      planned({
        kind: 'main',
        manufacturer: 'PD',
        model: 'Sigma 2',
        serial: null,
        notes: 'Tandem, Gris/Verde',
        details: { sizeSqft: 340, lineType: null },
      }),
    ];

    const report = await importer.apply(admin, dropzone.id, twins);

    expect(report.itemsCreated).toBe(4);
    expect(await manager.count(GearItem, { where: { kind: 'main' } })).toBe(2);
    expect((await importer.apply(admin, dropzone.id, twins)).itemsCreated).toBe(0);
  });

  test('carries the sheet warnings into the report', async () => {
    const withWarnings = plan();
    withWarnings.warnings = ['Container X: "07/12/1017" is not a valid date; left empty'];

    const report = await importer.apply(admin, dropzone.id, withWarnings);

    expect(report.warnings).toContain('Container X: "07/12/1017" is not a valid date; left empty');
  });
});
