import type {
  PackingComponents,
  PackingElements,
  PackingSheetView,
  SavePackingDraftRequestBody,
} from '@bendike/shared';

export interface Draft {
  performedOn: string;
  checkedIds: string[];
  bulletinsChecked: boolean | null;
  mardConnected: boolean | null;
  ownerName: string;
  ownerAddress: string;
  ownerPhone: string;
  ownerEmail: string;
  manualDocumentId: string | null;
  notes: string;
}

export type SheetNotice = { kind: 'sent'; to: string } | { kind: 'error'; message: string; whileSigning?: boolean };

export const LICENCE_KEY = 'bendike.riggerLicence';

export function toDraft(sheet: PackingSheetView): Draft {
  return {
    performedOn: sheet.performedOn,
    checkedIds: sheet.checkedIds,
    bulletinsChecked: sheet.bulletinsChecked,
    mardConnected: sheet.mardConnected,
    ownerName: sheet.ownerName,
    ownerAddress: sheet.ownerAddress,
    ownerPhone: sheet.ownerPhone,
    ownerEmail: sheet.ownerEmail,
    manualDocumentId: sheet.manualDocumentId,
    notes: sheet.notes,
  };
}

export function toBody(draft: Draft): SavePackingDraftRequestBody {
  return { ...draft };
}

export function elementsOf(components: PackingComponents): PackingElements {
  const pick = (kind: keyof PackingComponents) => {
    const info = components[kind];
    return info
      ? {
          kind,
          manufacturer: info.manufacturer,
          model: info.model,
          serial: info.serial,
          manufacturedOn: info.manufacturedOn,
        }
      : null;
  };
  return { reserve: pick('reserve'), container: pick('container'), aad: pick('aad') };
}

export function readLicence(): string {
  try {
    return localStorage.getItem(LICENCE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveLicence(licence: string): void {
  try {
    localStorage.setItem(LICENCE_KEY, licence);
  } catch {
    return;
  }
}
