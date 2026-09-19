import type { GearKind } from './gear';

export const BULLETIN_SEVERITIES = ['advisory', 'mandatory', 'grounding'] as const;
export type BulletinSeverity = (typeof BULLETIN_SEVERITIES)[number];

export const BULLETIN_STATUSES = ['draft', 'published', 'withdrawn'] as const;
export type BulletinStatus = (typeof BULLETIN_STATUSES)[number];

export const MATCH_STATUSES = ['open', 'complied', 'not_applicable'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export type MatchConfidence = 'exact' | 'needs_review';

export const GROUNDING_SOURCES = ['manual', 'bulletin'] as const;
export type GroundingSource = (typeof GROUNDING_SOURCES)[number];

export interface BulletinTargetInput {
  model?: string | null;
  serialFrom?: string | null;
  serialTo?: string | null;
  manufacturedFrom?: string | null;
  manufacturedTo?: string | null;
}

export interface BulletinDefinition {
  manufacturer: string;
  targets: readonly BulletinTargetInput[];
}

export interface GearIdentity {
  manufacturer: string;
  model: string;
  serial: string | null;
  manufacturedOn: string | null;
}

export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[\s\-_.]/g, '');
}

const DIGITS = /^\d+$/;

function serialVerdict(target: BulletinTargetInput, serial: string | null): 'in' | 'out' | 'unknown' {
  const from = target.serialFrom ?? null;
  const to = target.serialTo ?? null;
  if (from === null && to === null) {
    return 'in';
  }
  const comparable =
    serial !== null && DIGITS.test(serial) && (from === null || DIGITS.test(from)) && (to === null || DIGITS.test(to));
  if (!comparable) {
    return 'unknown';
  }
  const value = Number(serial);
  const tooLow = from !== null && value < Number(from);
  const tooHigh = to !== null && value > Number(to);
  return tooLow || tooHigh ? 'out' : 'in';
}

function dateVerdict(target: BulletinTargetInput, manufacturedOn: string | null): 'in' | 'out' | 'unknown' {
  const from = target.manufacturedFrom ?? null;
  const to = target.manufacturedTo ?? null;
  if (from === null && to === null) {
    return 'in';
  }
  if (manufacturedOn === null) {
    return 'unknown';
  }
  return (from !== null && manufacturedOn < from) || (to !== null && manufacturedOn > to) ? 'out' : 'in';
}

export function matchGearToTarget(
  manufacturer: string,
  target: BulletinTargetInput,
  gear: GearIdentity,
): MatchConfidence | null {
  if (normalizeName(gear.manufacturer) !== normalizeName(manufacturer)) {
    return null;
  }
  if (target.model && normalizeName(gear.model) !== normalizeName(target.model)) {
    return null;
  }
  const verdicts = [serialVerdict(target, gear.serial), dateVerdict(target, gear.manufacturedOn)];
  if (verdicts.includes('out')) {
    return null;
  }
  return verdicts.includes('unknown') ? 'needs_review' : 'exact';
}

export function matchGearToBulletin(bulletin: BulletinDefinition, gear: GearIdentity): MatchConfidence | null {
  const targets = bulletin.targets.length > 0 ? bulletin.targets : [{}];
  const results = targets.map((target) => matchGearToTarget(bulletin.manufacturer, target, gear));
  if (results.includes('exact')) {
    return 'exact';
  }
  return results.includes('needs_review') ? 'needs_review' : null;
}

export interface BulletinTargetView extends BulletinTargetInput {
  id: string;
}

export interface BulletinView {
  id: string;
  manufacturer: string;
  reference: string;
  title: string;
  summary: string;
  requiredAction: string;
  sourceUrl: string | null;
  issuedOn: string;
  severity: BulletinSeverity;
  status: BulletinStatus;
  publishedAt: string | null;
  targets: BulletinTargetView[];
  matchCounts: { open: number; total: number };
}

export interface CreateBulletinRequestBody {
  manufacturer: string;
  reference: string;
  title: string;
  summary: string;
  requiredAction: string;
  sourceUrl?: string;
  issuedOn: string;
  severity: BulletinSeverity;
  targets: BulletinTargetInput[];
}

export type UpdateBulletinRequestBody = Partial<CreateBulletinRequestBody>;

export interface BulletinMatchView {
  id: string;
  bulletin: {
    id: string;
    manufacturer: string;
    reference: string;
    title: string;
    severity: BulletinSeverity;
    requiredAction: string;
    sourceUrl: string | null;
  };
  confidence: MatchConfidence;
  status: MatchStatus;
  resolutionNote: string | null;
  resolvedAt: string | null;
  owner: { id: string; displayName: string };
  rig: { id: string; name: string } | null;
  item: { id: string; kind: GearKind; manufacturer: string; model: string; serial: string | null };
}

export interface ResolveMatchRequestBody {
  status: 'complied' | 'not_applicable';
  note: string;
}

export interface GroundingView {
  id: string;
  rigId: string | null;
  gearItemId: string | null;
  reason: string;
  source: GroundingSource;
  bulletinMatchId: string | null;
  openedByName: string;
  openedAt: string;
  closedByName: string | null;
  closedAt: string | null;
  closeNote: string | null;
}

export interface OpenGroundingRequestBody {
  rigId?: string;
  gearItemId?: string;
  reason: string;
}

export interface CloseGroundingRequestBody {
  note: string;
}
