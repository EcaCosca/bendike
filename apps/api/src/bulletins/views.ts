import type { GroundingView } from '@bendike/shared';
import type { Grounding } from './entities';

export function toGroundingView(grounding: Grounding, names: ReadonlyMap<string, string>): GroundingView {
  return {
    id: grounding.id,
    rigId: grounding.rigId,
    gearItemId: grounding.gearItemId,
    reason: grounding.reason,
    source: grounding.source,
    bulletinMatchId: grounding.bulletinMatchId,
    openedByName: names.get(grounding.openedBy) ?? 'Unknown',
    openedAt: grounding.openedAt.toISOString(),
    closedByName: grounding.closedBy === null ? null : (names.get(grounding.closedBy) ?? 'Unknown'),
    closedAt: grounding.closedAt === null ? null : grounding.closedAt.toISOString(),
    closeNote: grounding.closeNote,
  };
}
