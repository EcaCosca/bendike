import type { GearKind } from '@bendike/shared';

export type SheetRow = Record<string, unknown>;

export interface FleetSheets {
  equipos: SheetRow[];
  containers: SheetRow[];
  abridores: SheetRow[];
  reservas: SheetRow[];
  velamenes: SheetRow[];
}

export interface PlannedEntry {
  kind: 'repack' | 'aad_service';
  performedOn: string;
  description: string;
}

export interface PlannedItem {
  kind: GearKind;
  manufacturer: string;
  model: string;
  serial: string | null;
  manufacturedOn: string | null;
  notes: string;
  details: Record<string, unknown>;
  entries: PlannedEntry[];
}

export interface PlannedRig {
  name: string;
  active: boolean;
  items: PlannedItem[];
}

export interface FleetPlan {
  rigs: PlannedRig[];
  spares: PlannedItem[];
  warnings: string[];
}

export function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function cell(row: SheetRow, header: string): unknown {
  const wanted = normalizeHeader(header);
  const key = Object.keys(row).find((k) => normalizeHeader(k) === wanted);
  return key === undefined ? null : row[key];
}

function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function normalizeKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function toIso(value: unknown, context: string, warnings: string[]): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const raw = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) return raw;
  const local = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (local) {
    const [, day, month, year] = local;
    if (Number(year) >= 1950 && Number(year) <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  warnings.push(`${context}: "${raw}" is not a valid date; left empty`);
  return null;
}

interface Candidate {
  key: string;
  item: PlannedItem;
  rigName: string | null;
}

function label(kind: string, manufacturer: string, model: string, serial: string): string {
  return [kind, manufacturer, model, serial].filter(Boolean).join(' ');
}

function containerCandidates(rows: SheetRow[], warnings: string[]): Candidate[] {
  return rows
    .filter((row) => text(cell(row, 'Marca')))
    .map((row) => {
      const manufacturer = text(cell(row, 'Marca'));
      const model = text(cell(row, 'Modelo'));
      const serial = text(cell(row, 'Nro de Serie'));
      const context = label('Container', manufacturer, model, serial);
      return {
        key: normalizeKey(`${manufacturer} ${model} ${serial}`),
        rigName: null,
        item: {
          kind: 'container' as const,
          manufacturer,
          model,
          serial: serial || null,
          manufacturedOn: toIso(cell(row, 'Fecha Fabricación'), context, warnings),
          notes: '',
          details: { harnessSize: null, tso: null },
          entries: [],
        },
      };
    });
}

function aadCandidates(rows: SheetRow[], warnings: string[]): Candidate[] {
  return rows
    .filter((row) => text(cell(row, 'Marca')))
    .map((row) => {
      const brand = text(cell(row, 'Marca'));
      const model = text(cell(row, 'Modelo'));
      const manufacturer = brand.toLowerCase() === 'aad' && /^vigil/i.test(model) ? 'Vigil' : brand;
      const serial = text(cell(row, 'Nro de Serie'));
      const context = label('AAD', manufacturer, model, serial);
      const dueForService = toIso(cell(row, 'Toca Recorrida'), context, warnings);
      const expires = toIso(cell(row, 'Vencimiento'), context, warnings);
      const servicedOn = toIso(cell(row, 'Fecha Recorrido'), context, warnings);
      return {
        key: normalizeKey(serial),
        rigName: null,
        item: {
          kind: 'aad' as const,
          manufacturer,
          model,
          serial: serial || null,
          manufacturedOn: toIso(cell(row, 'Fecha Fabricación'), context, warnings),
          notes: text(cell(row, 'Obs')),
          details: {
            mode: null,
            batteryInstalledOn: null,
            batteryCycleMonths: null,
            serviceDueOn: servicedOn ? null : dueForService,
            expiresOn: expires,
          },
          entries: servicedOn
            ? [
                {
                  kind: 'aad_service' as const,
                  performedOn: servicedOn,
                  description: "Service recorded in the dropzone's spreadsheet",
                },
              ]
            : [],
        },
      };
    });
}

function reserveCandidates(rows: SheetRow[], warnings: string[]): Candidate[] {
  return rows
    .filter((row) => text(cell(row, 'Marca')))
    .map((row) => {
      const manufacturer = text(cell(row, 'Marca'));
      const model = text(cell(row, 'Modelo'));
      const serial = text(cell(row, 'Nro de Serie'));
      const context = label('Reserve', manufacturer, model, serial);
      const folded = toIso(cell(row, 'Fecha Ultimo Plegado'), context, warnings);
      return {
        key: normalizeKey(`${manufacturer} ${model} ${serial}`),
        rigName: null,
        item: {
          kind: 'reserve' as const,
          manufacturer,
          model,
          serial: serial || null,
          manufacturedOn: toIso(cell(row, 'Fecha Fabricación'), context, warnings),
          notes: text(cell(row, 'Obs')),
          details: { sizeSqft: null, repackCycleDays: null, deployments: 0 },
          entries: folded
            ? [
                {
                  kind: 'repack' as const,
                  performedOn: folded,
                  description: "Repack recorded in the dropzone's spreadsheet (last fold date)",
                },
              ]
            : [],
        },
      };
    });
}

function mainCandidates(rows: SheetRow[], warnings: string[]): Candidate[] {
  return rows
    .filter((row) => text(cell(row, 'Marca')))
    .map((row) => {
      const manufacturer = text(cell(row, 'Marca'));
      const model = text(cell(row, 'Modelo'));
      const size = text(cell(row, 'Tamaño'));
      const type = text(cell(row, 'Tipo'));
      const colour = text(cell(row, 'Color'));
      const serial = text(cell(row, 'Serial'));
      const context = label('Main', manufacturer, model, size);
      return {
        key: normalizeKey(`${manufacturer} ${model} ${size} (${type} - ${colour})`),
        rigName: null,
        item: {
          kind: 'main' as const,
          manufacturer,
          model,
          serial: serial || null,
          manufacturedOn: toIso(cell(row, 'DOM'), context, warnings),
          notes: [type, colour].filter(Boolean).join(', '),
          details: { sizeSqft: size ? Number(size) : null, lineType: null },
          entries: [],
        },
      };
    });
}

const SLOTS: { header: string; kind: GearKind; sheetName: string }[] = [
  { header: 'Container', kind: 'container', sheetName: 'Containers' },
  { header: 'Abridor', kind: 'aad', sheetName: 'Abridores' },
  { header: 'Reserva', kind: 'reserve', sheetName: 'Reservas' },
  { header: 'Principal', kind: 'main', sheetName: 'Velamenes' },
];

export function buildFleetPlan(sheets: FleetSheets): FleetPlan {
  const warnings: string[] = [];
  const pools: Record<GearKind, Candidate[]> = {
    container: containerCandidates(sheets.containers, warnings),
    aad: aadCandidates(sheets.abridores, warnings),
    reserve: reserveCandidates(sheets.reservas, warnings),
    main: mainCandidates(sheets.velamenes, warnings),
  };

  const rigs: PlannedRig[] = [];
  for (const row of sheets.equipos) {
    const name = text(cell(row, 'Nombre'));
    if (!name) continue;
    const rig: PlannedRig = { name, active: text(cell(row, 'Inactivo (SI - NO)')).toUpperCase() !== 'SI', items: [] };
    for (const slot of SLOTS) {
      const reference = text(cell(row, slot.header));
      if (!reference) continue;
      const match = pools[slot.kind].find((c) => c.key === normalizeKey(reference));
      if (!match) {
        warnings.push(`Rig ${name}: ${slot.header.toLowerCase()} "${reference}" is not in the ${slot.sheetName} sheet`);
      } else if (match.rigName !== null) {
        warnings.push(`Rig ${name}: ${slot.header.toLowerCase()} "${reference}" is already in rig ${match.rigName}`);
      } else {
        match.rigName = name;
        rig.items.push(match.item);
      }
    }
    rigs.push(rig);
  }

  const spares = Object.values(pools)
    .flat()
    .filter((c) => c.rigName === null)
    .map((c) => c.item);
  return { rigs, spares, warnings };
}
