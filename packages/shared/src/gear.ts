import type { BulletinSeverity, GroundingView, MatchConfidence } from './bulletins';
export const GEAR_KINDS = ['container', 'main', 'reserve', 'aad'] as const;
export type GearKind = (typeof GEAR_KINDS)[number];

export const PART_KINDS = ['bridle', 'pilot_chute', 'risers', 'toggles', 'handles', 'other'] as const;
export type PartKind = (typeof PART_KINDS)[number];

export const MAINTENANCE_KINDS = [
  'repack',
  'reline',
  'kill_line',
  'inspection',
  'repair',
  'battery',
  'aad_service',
  'assembly',
  'other',
] as const;
export type MaintenanceKind = (typeof MAINTENANCE_KINDS)[number];

export const SAFETY_KINDS: readonly MaintenanceKind[] = ['repack', 'aad_service', 'repair'];

export const INSPECTION_RESULTS = ['passed', 'needs_work', 'grounded'] as const;
export type InspectionResult = (typeof INSPECTION_RESULTS)[number];

export const DUE_KINDS = ['repack', 'battery', 'service', 'expiry'] as const;
export type DueKind = (typeof DUE_KINDS)[number];

export const DUE_STATUSES = ['overdue', 'due_soon', 'no_data', 'ok'] as const;
export type DueStatus = (typeof DUE_STATUSES)[number];

export interface ContainerDetails {
  harnessSize: string | null;
  tso: string | null;
}

export interface MainDetails {
  sizeSqft: number | null;
  lineType: string | null;
}

export interface ReserveDetails {
  sizeSqft: number | null;
  repackCycleDays: number | null;
  deployments: number;
}

export interface AadDetails {
  mode: string | null;
  batteryInstalledOn: string | null;
  batteryCycleMonths: number | null;
  serviceDueOn: string | null;
  expiresOn: string | null;
}

export type GearDetails = ContainerDetails | MainDetails | ReserveDetails | AadDetails;

export interface GearModelRules {
  repackCycleDays: number | null;
  serviceIntervalMonths: number | null;
  batteryCycleMonths: number | null;
  lifeYears: number | null;
}

export interface GearModelView extends GearModelRules {
  id: string;
  kind: GearKind;
  manufacturer: string;
  model: string;
  active: boolean;
}

export interface CreateGearModelRequestBody extends Partial<GearModelRules> {
  kind: GearKind;
  manufacturer: string;
  model: string;
}

export interface UpdateGearModelRequestBody extends Partial<GearModelRules> {
  manufacturer?: string;
  model?: string;
  active?: boolean;
}

export interface ComponentPartView {
  id: string;
  gearItemId: string;
  kind: PartKind;
  description: string;
  serial: string | null;
  manufacturedOn: string | null;
  notes: string;
}

export interface MaintenanceEntryView {
  id: string;
  gearItemId: string;
  kind: MaintenanceKind;
  result: InspectionResult | null;
  performedOn: string;
  description: string;
  performedById: string | null;
  performedByName: string;
  performedByLicence: string | null;
  performedByContact: string | null;
  ownerReported: boolean;
  verifiedAt: string | null;
  verifiedById: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
}

export interface DueItem {
  kind: DueKind;
  dueOn: string | null;
  daysLeft: number | null;
  status: DueStatus;
}

export interface OpenBulletinNotice {
  matchId: string;
  bulletinId: string;
  reference: string;
  title: string;
  severity: BulletinSeverity;
  confidence: MatchConfidence;
}

export interface GearItemView {
  id: string;
  ownerId: string;
  rigId: string | null;
  modelId: string | null;
  kind: GearKind;
  manufacturer: string;
  model: string;
  serial: string | null;
  manufacturedOn: string | null;
  notes: string;
  retiredAt: string | null;
  details: GearDetails;
  parts: ComponentPartView[];
  dues: DueItem[];
  status: DueStatus;
  pendingVerification: PendingVerification[];
  bulletins: OpenBulletinNotice[];
  groundings: GroundingView[];
}

export interface RiggerName {
  id: string;
  displayName: string;
}

export interface PendingVerification {
  entryId: string;
  gearItemId: string;
  kind: MaintenanceKind;
  performedOn: string;
  performedByName: string;
  performedByContact: string | null;
}

export interface InspectionSummary {
  entryId: string;
  gearItemId: string;
  performedOn: string;
  result: InspectionResult;
  performedByName: string;
  description: string;
}

export type ReadinessReason =
  | { type: 'pending_verification'; entries: PendingVerification[] }
  | { type: 'inspection_grounded'; inspection: InspectionSummary }
  | { type: 'grounding'; grounding: GroundingView };

export interface Readiness {
  state: 'airworthy' | 'grounded';
  reasons: ReadinessReason[];
}

export interface RigView {
  id: string;
  ownerId: string;
  name: string;
  notes: string;
  active: boolean;
  slots: Record<GearKind, GearItemView | null>;
  status: DueStatus;
  readiness: Readiness;
  lastInspection: InspectionSummary | null;
  riggers: RiggerName[];
}

export interface GearOverview {
  rigs: RigView[];
  spares: GearItemView[];
  summary: Record<DueStatus, number> & { grounded: number };
}

export interface RigDetailView extends RigView {
  entries: MaintenanceEntryView[];
  groundingHistory: GroundingView[];
}

export interface GearItemDetailView extends GearItemView {
  entries: MaintenanceEntryView[];
}

export interface CreateRigRequestBody {
  name: string;
  notes?: string;
  ownerId?: string;
}

export interface UpdateRigRequestBody {
  name?: string;
  notes?: string;
  active?: boolean;
}

export interface CreateGearItemRequestBody {
  kind: GearKind;
  manufacturer: string;
  model: string;
  serial?: string;
  manufacturedOn?: string;
  notes?: string;
  modelId?: string;
  rigId?: string;
  ownerId?: string;
  details?: Partial<GearDetails>;
}

export interface UpdateGearItemRequestBody {
  manufacturer?: string;
  model?: string;
  serial?: string | null;
  manufacturedOn?: string | null;
  notes?: string;
  modelId?: string | null;
  rigId?: string | null;
  retired?: boolean;
  details?: Partial<GearDetails>;
}

export interface CreatePartRequestBody {
  kind: PartKind;
  description: string;
  serial?: string;
  manufacturedOn?: string;
  notes?: string;
}

export interface UpdatePartRequestBody extends Partial<Omit<CreatePartRequestBody, 'serial' | 'manufacturedOn'>> {
  serial?: string | null;
  manufacturedOn?: string | null;
}

export interface CreateMaintenanceEntryRequestBody {
  kind: MaintenanceKind;
  performedOn: string;
  description: string;
  result?: InspectionResult;
  performedByName?: string;
  performedByContact?: string;
  performedByLicence?: string;
  nextServiceDueOn?: string;
}

export interface VoidMaintenanceEntryRequestBody {
  reason: string;
}
