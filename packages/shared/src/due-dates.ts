import type {
  AadDetails,
  DueItem,
  DueKind,
  DueStatus,
  GearKind,
  GearModelRules,
  MaintenanceKind,
  ReserveDetails,
} from './gear';
import { SAFETY_KINDS } from './gear';

export const GEAR_TIME_ZONE = 'America/Argentina/Buenos_Aires';
export const DEFAULT_REPACK_CYCLE_DAYS = 180;
export const DUE_WINDOW_DAYS: Record<DueKind, number> = { repack: 21, battery: 90, service: 90, expiry: 90 };

const DAY_MS = 86_400_000;

function parse(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function format(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayIn(now: Date, timeZone: string = GEAR_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function addDays(date: string, days: number): string {
  return format(new Date(parse(date).getTime() + days * DAY_MS));
}

export function addMonths(date: string, months: number): string {
  const start = parse(date);
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return format(target);
}

export function addYears(date: string, years: number): string {
  return addMonths(date, years * 12);
}

export function daysUntil(date: string, today: string): number {
  return Math.round((parse(date).getTime() - parse(today).getTime()) / DAY_MS);
}

export function dueStatus(dueOn: string | null, windowDays: number, today: string): DueStatus {
  if (dueOn === null) {
    return 'no_data';
  }
  const left = daysUntil(dueOn, today);
  if (left < 0) {
    return 'overdue';
  }
  return left <= windowDays ? 'due_soon' : 'ok';
}

const SEVERITY: Record<DueStatus, number> = { overdue: 3, due_soon: 2, no_data: 1, ok: 0 };

export function worstStatus(statuses: readonly DueStatus[]): DueStatus {
  if (statuses.length === 0) {
    return 'no_data';
  }
  return statuses.reduce((worst, next) => (SEVERITY[next] > SEVERITY[worst] ? next : worst));
}

export function statusSeverity(status: DueStatus): number {
  return SEVERITY[status];
}

export interface DueEntryInput {
  kind: MaintenanceKind;
  performedOn: string;
  voided: boolean;
}

export interface ComputeDueInput {
  kind: GearKind;
  entries: readonly DueEntryInput[];
  manufacturedOn: string | null;
  details: object;
  model: Partial<GearModelRules> | null;
  today: string;
}

function latest(entries: readonly DueEntryInput[], kind: MaintenanceKind): string | null {
  const dates = entries.filter((e) => e.kind === kind && !e.voided).map((e) => e.performedOn);
  return dates.length === 0 ? null : dates.reduce((a, b) => (a > b ? a : b));
}

function item(kind: DueKind, dueOn: string | null, today: string): DueItem {
  return {
    kind,
    dueOn,
    daysLeft: dueOn === null ? null : daysUntil(dueOn, today),
    status: dueStatus(dueOn, DUE_WINDOW_DAYS[kind], today),
  };
}

function reserveItems(input: ComputeDueInput): DueItem[] {
  const details = input.details as Partial<ReserveDetails>;
  const cycle = details.repackCycleDays ?? input.model?.repackCycleDays ?? DEFAULT_REPACK_CYCLE_DAYS;
  const last = latest(input.entries, 'repack');
  return [item('repack', last === null ? null : addDays(last, cycle), input.today)];
}

function aadItems(input: ComputeDueInput): DueItem[] {
  const details = input.details as Partial<AadDetails>;
  const model = input.model;
  const items: DueItem[] = [];

  const batteryCycle = details.batteryCycleMonths ?? model?.batteryCycleMonths ?? null;
  if (batteryCycle !== null) {
    const base = latest(input.entries, 'battery') ?? details.batteryInstalledOn ?? null;
    items.push(item('battery', base === null ? null : addMonths(base, batteryCycle), input.today));
  }

  const interval = model?.serviceIntervalMonths ?? null;
  const lastService = latest(input.entries, 'aad_service');
  const typedService = details.serviceDueOn ?? null;
  if (interval !== null) {
    const firstDue = typedService ?? (input.manufacturedOn === null ? null : addMonths(input.manufacturedOn, interval));
    items.push(item('service', lastService === null ? firstDue : addMonths(lastService, interval), input.today));
  } else if (typedService !== null) {
    items.push(item('service', typedService, input.today));
  }

  const lifeYears = model?.lifeYears ?? null;
  const expiresOn =
    details.expiresOn ??
    (lifeYears !== null && input.manufacturedOn !== null ? addYears(input.manufacturedOn, lifeYears) : null);
  if (expiresOn !== null) {
    items.push(item('expiry', expiresOn, input.today));
  }

  return items.length > 0 ? items : [item('expiry', null, input.today)];
}

export function computeDueItems(input: ComputeDueInput): DueItem[] {
  if (input.kind === 'reserve') {
    return reserveItems(input);
  }
  if (input.kind === 'aad') {
    return aadItems(input);
  }
  return [];
}

export interface VerifiableEntry {
  kind: MaintenanceKind;
  ownerReported: boolean;
  verifiedAt: string | null;
  voided: boolean;
}

export function needsVerification(entry: VerifiableEntry): boolean {
  return entry.ownerReported && entry.verifiedAt === null && !entry.voided && SAFETY_KINDS.includes(entry.kind);
}
