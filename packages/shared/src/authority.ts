import type { CountryCode } from './countries';
import type { GroundingView } from './bulletins';
import type { InspectionResult, MaintenanceKind } from './gear';

export const AUTHORITY_PAGE_SIZE = 25;

export const RIGGER_REGISTRY_SORTS = ['name', 'activity'] as const;
export type RiggerRegistrySort = (typeof RIGGER_REGISTRY_SORTS)[number];

export interface RiggerRegistryRow {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  licence: string | null;
  signedSheets: number;
  workRecorded: number;
  lastActivityAt: string | null;
  customers: number;
}

export interface AuthorityPage<T> {
  rows: T[];
  total: number;
}

export interface AuthoritySheetRow {
  id: string;
  rigId: string;
  rigName: string;
  sheetNo: number;
  performedOn: string;
  ownerName: string;
  missingCount: number;
  voided: boolean;
  signedAt: string;
}

export interface AuthorityWorkRow {
  id: string;
  relation: 'performed' | 'verified';
  performedOn: string;
  kind: MaintenanceKind;
  result: InspectionResult | null;
  componentLabel: string;
  rigName: string | null;
  ownerName: string;
  description: string;
  voided: boolean;
  voidReason: string | null;
}

export interface AuthorityGroundingRow extends GroundingView {
  rigName: string | null;
}

export const RIG_RESIDENCES = ['all', 'local', 'abroad', 'unknown'] as const;
export type RigResidence = (typeof RIG_RESIDENCES)[number];

export interface AuthorityRigRow {
  rigId: string;
  rigName: string;
  ownerName: string;
  ownerCountry: CountryCode | null;
  reserve: string;
  reserveSerial: string | null;
  lastPackedOn: string;
  riggerId: string;
  riggerName: string;
  riggerLicence: string | null;
  sheets: number;
  latestSheetId: string;
}
