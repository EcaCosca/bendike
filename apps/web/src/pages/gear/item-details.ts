import type { AadDetails, ContainerDetails, GearItemView, MainDetails, ReserveDetails } from '@bendike/shared';
import type { TFunction } from 'i18next';
import i18n from '../../i18n/i18n';

export function detailLine(item: GearItemView, t: TFunction = i18n.t): string {
  const parts: (string | null)[] = [];
  switch (item.kind) {
    case 'container': {
      const d = item.details as ContainerDetails;
      parts.push(
        d.harnessSize ? t('gear.details.harness', { size: d.harnessSize }) : null,
        d.tso ? t('gear.details.tso', { tso: d.tso }) : null,
      );
      break;
    }
    case 'main': {
      const d = item.details as MainDetails;
      parts.push(d.sizeSqft ? t('gear.details.sqft', { size: d.sizeSqft }) : null, d.lineType);
      break;
    }
    case 'reserve': {
      const d = item.details as ReserveDetails;
      parts.push(
        d.sizeSqft ? t('gear.details.sqft', { size: d.sizeSqft }) : null,
        d.repackCycleDays ? t('gear.details.repackEvery', { count: d.repackCycleDays }) : null,
        d.deployments ? t('gear.details.deployments', { count: d.deployments }) : null,
      );
      break;
    }
    case 'aad': {
      const d = item.details as AadDetails;
      parts.push(
        d.mode ? t('gear.details.mode', { mode: d.mode }) : null,
        d.batteryInstalledOn ? t('gear.details.batteryInstalled', { date: d.batteryInstalledOn }) : null,
      );
      break;
    }
  }
  return parts.filter(Boolean).join(' · ');
}

export function identityLine(item: GearItemView, t: TFunction = i18n.t): string {
  return [
    `${item.manufacturer} ${item.model}`,
    item.serial && `#${item.serial}`,
    item.manufacturedOn && t('gear.details.made', { date: item.manufacturedOn }),
  ]
    .filter(Boolean)
    .join(' · ');
}

export const KIND_LABEL_KEYS = {
  container: 'gear.kind.container',
  main: 'gear.kind.main',
  reserve: 'gear.kind.reserve',
  aad: 'gear.kind.aad',
} as const;
