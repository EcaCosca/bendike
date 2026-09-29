import type { MaintenanceEntryView } from '@bendike/shared';
import type { TFunction } from 'i18next';
import i18n from '../../i18n/i18n';
import { ENTRY_KIND_LABEL_KEYS } from '../gear/entry-kinds';

export function workLabel(
  entry: MaintenanceEntryView,
  itemLabels: Record<string, string>,
  t: TFunction = i18n.t,
): string {
  return [entry.performedOn, t(ENTRY_KIND_LABEL_KEYS[entry.kind]), itemLabels[entry.gearItemId]]
    .filter(Boolean)
    .join(' · ');
}
