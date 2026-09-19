import type { AadDetails, ContainerDetails, GearItemView, MainDetails, ReserveDetails } from '@bendike/shared';

export const KIND_LABELS = { container: 'Container', main: 'Main', reserve: 'Reserve', aad: 'AAD' } as const;

export function detailLine(item: GearItemView): string {
  const parts: (string | null)[] = [];
  switch (item.kind) {
    case 'container': {
      const d = item.details as ContainerDetails;
      parts.push(d.harnessSize && `Harness ${d.harnessSize}`, d.tso && `TSO ${d.tso}`);
      break;
    }
    case 'main': {
      const d = item.details as MainDetails;
      parts.push(d.sizeSqft ? `${d.sizeSqft} sq ft` : null, d.lineType);
      break;
    }
    case 'reserve': {
      const d = item.details as ReserveDetails;
      parts.push(
        d.sizeSqft ? `${d.sizeSqft} sq ft` : null,
        d.repackCycleDays ? `repack every ${d.repackCycleDays} days` : null,
        d.deployments ? `${d.deployments} deployments` : null,
      );
      break;
    }
    case 'aad': {
      const d = item.details as AadDetails;
      parts.push(d.mode && `Mode ${d.mode}`, d.batteryInstalledOn && `Battery installed ${d.batteryInstalledOn}`);
      break;
    }
  }
  return parts.filter(Boolean).join(' · ');
}

export function identityLine(item: GearItemView): string {
  return [
    `${item.manufacturer} ${item.model}`,
    item.serial && `#${item.serial}`,
    item.manufacturedOn && `made ${item.manufacturedOn}`,
  ]
    .filter(Boolean)
    .join(' · ');
}
