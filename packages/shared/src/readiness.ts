import type { ReadinessReason } from './gear';

export function describeReason(reason: ReadinessReason): string {
  switch (reason.type) {
    case 'pending_verification':
      return `Work awaiting verification (${reason.entries.length})`;
    case 'inspection_grounded':
      return `Grounded at an inspection on ${reason.inspection.performedOn}: ${reason.inspection.description}`;
    case 'grounding':
      return reason.grounding.source === 'bulletin'
        ? reason.grounding.reason
        : `Grounded by ${reason.grounding.openedByName}: ${reason.grounding.reason}`;
  }
}
