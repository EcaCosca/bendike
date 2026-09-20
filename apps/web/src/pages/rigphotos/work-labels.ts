import type { MaintenanceEntryView } from '@bendike/shared';
import { ENTRY_KIND_LABELS } from '../gear/entry-kinds';

export function workLabel(entry: MaintenanceEntryView, itemLabels: Record<string, string>): string {
  return [entry.performedOn, ENTRY_KIND_LABELS[entry.kind], itemLabels[entry.gearItemId]].filter(Boolean).join(' · ');
}
