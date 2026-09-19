import 'reflect-metadata';
import { resolve } from 'node:path';
import { Workbook, type CellValue } from 'exceljs';
import { BulletinMatcher } from '../src/bulletins/bulletin-matcher';
import { RiggerLinksService } from '../src/rigger-links/rigger-links.service';
import { GearAccessService } from '../src/gear/gear-access.service';
import { SystemGearClock } from '../src/gear/gear-clock';
import { GearReadService } from '../src/gear/gear-read.service';
import { GearService } from '../src/gear/gear.service';
import { MaintenanceService } from '../src/gear/maintenance.service';
import { FleetImporter } from '../src/gear/fleet-import/fleet-importer';
import { buildFleetPlan, type FleetSheets, type SheetRow } from '../src/gear/fleet-import/fleet-plan';
import dataSource from '../src/database/data-source';
import { User } from '../src/users/user.entity';

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function plain(value: CellValue): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && !(value instanceof Date)) {
    if ('result' in value) return plain(value.result);
    if ('richText' in value) return value.richText.map((part) => part.text).join('');
    if ('text' in value) return value.text;
    return null;
  }
  return value;
}

async function readSheets(file: string): Promise<FleetSheets> {
  const workbook = new Workbook();
  await workbook.xlsx.readFile(file);
  const read = (name: string): SheetRow[] => {
    const sheet = workbook.getWorksheet(name);
    if (!sheet) throw new Error(`The workbook has no sheet named "${name}"`);
    const headers = new Map<number, string>();
    sheet.getRow(2).eachCell((cell, column) => {
      const raw = plain(cell.value);
      const header = typeof raw === 'string' ? raw.trim() : '';
      if (header) headers.set(column, header);
    });
    const rows: SheetRow[] = [];
    for (let r = 3; r <= sheet.rowCount; r += 1) {
      const row: SheetRow = {};
      let filled = false;
      for (const [column, header] of headers) {
        const value = plain(sheet.getRow(r).getCell(column).value);
        row[header] = value;
        filled ||= value !== null && value !== '';
      }
      if (filled) rows.push(row);
    }
    return rows;
  };
  return {
    equipos: read('Equipos'),
    containers: read('Containers'),
    abridores: read('Abridores'),
    reservas: read('Reservas'),
    velamenes: read('Velamenes'),
  };
}

async function main(): Promise<void> {
  const file = argument('file');
  const ownerEmail = argument('owner-email');
  const asEmail = argument('as');
  const dryRun = process.argv.includes('--dry-run');
  if (!file || !ownerEmail || !asEmail) {
    throw new Error(
      'Usage: import:fleet --file <Equipos.xlsx> --owner-email <dropzone email> --as <admin email> [--dry-run]',
    );
  }

  const plan = buildFleetPlan(await readSheets(resolve(file)));
  console.log(
    `Plan: ${plan.rigs.length} rigs, ${plan.rigs.reduce((n, r) => n + r.items.length, 0)} components in rigs, ${plan.spares.length} spares`,
  );
  for (const warning of plan.warnings) console.log(`  warning: ${warning}`);
  if (dryRun) {
    console.log('Dry run: nothing was written.');
    return;
  }

  await dataSource.initialize();
  try {
    const report = await dataSource.transaction(async (manager) => {
      const owner = await manager.findOneByOrFail(User, { email: ownerEmail.toLowerCase() });
      const actor = await manager.findOneByOrFail(User, { email: asEmail.toLowerCase() });
      const links = new RiggerLinksService(manager);
      const access = new GearAccessService(links);
      const clock = new SystemGearClock();
      const read = new GearReadService(manager, access, clock, links);
      const importer = new FleetImporter(
        manager,
        new GearService(manager, access, read, clock, new BulletinMatcher(manager)),
        new MaintenanceService(manager, access, clock),
      );
      return importer.apply(actor, owner.id, plan);
    });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
