import type { GroundingView } from './bulletins';
import type { MaintenanceEntryView, MaintenanceKind } from './gear';

export const RIG_PHOTO_MAX_BYTES = 8 * 1024 * 1024;
export const RIG_PHOTO_MAX_PER_RIG = 20;
export const RIG_PHOTO_MAX_SIDE = 1600;

export interface RigPhotoView {
  id: string;
  rigId: string;
  entryId: string | null;
  fileName: string;
  sizeBytes: number;
  caption: string;
  addedById: string;
  addedByName: string;
  createdAt: string;
}

export type RigCovers = Record<string, string>;

export const TIMELINE_CATEGORIES = ['repack', 'service', 'inspection', 'grounding', 'photo', 'other'] as const;
export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];

export const TIMELINE_CATEGORY_LABELS: Record<TimelineCategory, string> = {
  repack: 'Repacks',
  service: 'Services',
  inspection: 'Inspections',
  grounding: 'Groundings',
  photo: 'Photos',
  other: 'Other',
};

export interface TimelineSheet {
  id: string;
  entryId: string | null;
  sheetNo: number;
}

interface TimelineBase {
  id: string;
  date: string;
  sortKey: string;
}

export type TimelineEvent =
  | (TimelineBase & {
      type: 'work';
      category: TimelineCategory;
      entry: MaintenanceEntryView;
      componentLabel: string;
      sheet: { id: string; sheetNo: number } | null;
      photos: RigPhotoView[];
    })
  | (TimelineBase & {
      type: 'grounding';
      category: 'grounding';
      phase: 'opened' | 'cleared';
      grounding: GroundingView;
    })
  | (TimelineBase & { type: 'photo'; category: 'photo'; photo: RigPhotoView });

const SERVICE_KINDS: readonly MaintenanceKind[] = ['aad_service', 'battery', 'reline', 'kill_line', 'repair'];

function categoryOf(kind: MaintenanceKind): TimelineCategory {
  if (kind === 'repack') return 'repack';
  if (kind === 'inspection') return 'inspection';
  return SERVICE_KINDS.includes(kind) ? 'service' : 'other';
}

export interface TimelineInput {
  entries: readonly MaintenanceEntryView[];
  groundings: readonly GroundingView[];
  photos: readonly RigPhotoView[];
  sheets: readonly TimelineSheet[];
  itemLabels: Record<string, string>;
}

export function buildRigTimeline(input: TimelineInput): TimelineEvent[] {
  const entryIds = new Set(input.entries.map((entry) => entry.id));
  const events: TimelineEvent[] = [];

  for (const entry of input.entries) {
    const sheet = input.sheets.find((s) => s.entryId === entry.id);
    events.push({
      type: 'work',
      id: entry.id,
      date: entry.performedOn,
      sortKey: `${entry.performedOn}|${entry.createdAt}`,
      category: categoryOf(entry.kind),
      entry,
      componentLabel: input.itemLabels[entry.gearItemId] ?? '',
      sheet: sheet ? { id: sheet.id, sheetNo: sheet.sheetNo } : null,
      photos: input.photos.filter((photo) => photo.entryId === entry.id),
    });
  }

  for (const grounding of input.groundings) {
    events.push({
      type: 'grounding',
      category: 'grounding',
      phase: 'opened',
      id: `${grounding.id}-opened`,
      date: grounding.openedAt.slice(0, 10),
      sortKey: `${grounding.openedAt.slice(0, 10)}|${grounding.openedAt}`,
      grounding,
    });
    if (grounding.closedAt) {
      events.push({
        type: 'grounding',
        category: 'grounding',
        phase: 'cleared',
        id: `${grounding.id}-cleared`,
        date: grounding.closedAt.slice(0, 10),
        sortKey: `${grounding.closedAt.slice(0, 10)}|${grounding.closedAt}`,
        grounding,
      });
    }
  }

  for (const photo of input.photos) {
    if (photo.entryId !== null && entryIds.has(photo.entryId)) continue;
    events.push({
      type: 'photo',
      category: 'photo',
      id: photo.id,
      date: photo.createdAt.slice(0, 10),
      sortKey: `${photo.createdAt.slice(0, 10)}|${photo.createdAt}`,
      photo,
    });
  }

  return events.sort((a, b) => (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0));
}

export function filterTimeline(events: readonly TimelineEvent[], category: TimelineCategory | null): TimelineEvent[] {
  if (category === null) return [...events];
  if (category === 'photo') {
    return events.filter((event) => event.type === 'photo' || (event.type === 'work' && event.photos.length > 0));
  }
  return events.filter((event) => event.category === category);
}
