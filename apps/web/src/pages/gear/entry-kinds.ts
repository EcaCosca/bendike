import {
  SAFETY_KINDS,
  Role,
  type GearKind,
  type InspectionResult,
  type InspectionSummary,
  type MaintenanceEntryView,
  type MaintenanceKind,
} from '@bendike/shared';

export const ENTRY_KIND_LABELS: Record<MaintenanceKind, string> = {
  repack: 'Repack',
  reline: 'Reline',
  kill_line: 'Kill line change',
  inspection: 'Inspection',
  repair: 'Repair',
  battery: 'Battery',
  aad_service: 'AAD service',
  assembly: 'Assembly',
  other: 'Other',
};

const KINDS_BY_COMPONENT: Record<GearKind, MaintenanceKind[]> = {
  reserve: ['repack', 'repair', 'inspection', 'other'],
  aad: ['aad_service', 'battery', 'repair', 'inspection', 'other'],
  main: ['reline', 'kill_line', 'repair', 'inspection', 'other'],
  container: ['repair', 'inspection', 'other'],
};

export const INSPECTION_RESULT_LABELS: Record<InspectionResult, string> = {
  passed: 'Passed',
  needs_work: 'Needs work',
  grounded: 'Grounded',
};

export function canSignOff(role: Role): boolean {
  return role === Role.Rigger || role === Role.Admin;
}

export function entryKindsFor(component: GearKind, role: Role): MaintenanceKind[] {
  return KINDS_BY_COMPONENT[component].filter((kind) => kind !== 'inspection' || canSignOff(role));
}

export function isSafetyKind(kind: MaintenanceKind): boolean {
  return SAFETY_KINDS.includes(kind);
}

export interface OutsideRigger {
  name: string;
  contact: string;
  licence: string;
}

export function outsideRiggersFrom(entries: readonly MaintenanceEntryView[]): OutsideRigger[] {
  const seen = new Map<string, OutsideRigger>();
  for (const entry of entries) {
    if (entry.ownerReported && entry.performedByName && !seen.has(entry.performedByName)) {
      seen.set(entry.performedByName, {
        name: entry.performedByName,
        contact: entry.performedByContact ?? '',
        licence: entry.performedByLicence ?? '',
      });
    }
  }
  return [...seen.values()];
}

export function inspectionLine(inspection: InspectionSummary | null): string {
  return inspection
    ? `Inspected ${inspection.performedOn}: ${INSPECTION_RESULT_LABELS[inspection.result]} by ${inspection.performedByName}`
    : 'Never inspected';
}
