import type { PackingSheetSummary, PackingSheetView } from '@bendike/shared';
import type { PackingSheet } from './packing-sheet.entity';

export interface SheetContext {
  rigName: string;
  voided: boolean;
  voidReason: string | null;
}

export function toSheetView(sheet: PackingSheet, context: SheetContext): PackingSheetView {
  return {
    id: sheet.id,
    rigId: sheet.rigId,
    rigName: context.rigName,
    reserveItemId: sheet.reserveItemId,
    ownerId: sheet.ownerId,
    riggerId: sheet.riggerId,
    riggerName: sheet.riggerName,
    riggerLicence: sheet.riggerLicence,
    status: sheet.status,
    voided: context.voided,
    voidReason: context.voidReason,
    sheetNo: sheet.sheetNo,
    performedOn: sheet.performedOn,
    checklistVersion: sheet.checklistVersion,
    checkedIds: sheet.checkedIds,
    bulletinsChecked: sheet.bulletinsChecked,
    mardConnected: sheet.mardConnected,
    ownerName: sheet.ownerName,
    ownerAddress: sheet.ownerAddress,
    ownerPhone: sheet.ownerPhone,
    ownerEmail: sheet.ownerEmail,
    manualDocumentId: sheet.manualDocumentId,
    manualLabel: sheet.manualLabel,
    notes: sheet.notes,
    elements: sheet.elements,
    missing: sheet.missing,
    signedAt: sheet.signedAt?.toISOString() ?? null,
    entryId: sheet.entryId,
    createdAt: sheet.createdAt.toISOString(),
    updatedAt: sheet.updatedAt.toISOString(),
  };
}

export function toSummary(sheet: PackingSheet, context: SheetContext): PackingSheetSummary {
  return {
    id: sheet.id,
    rigId: sheet.rigId,
    rigName: context.rigName,
    reserveItemId: sheet.reserveItemId,
    sheetNo: sheet.sheetNo ?? 0,
    performedOn: sheet.performedOn,
    riggerName: sheet.riggerName,
    missingCount: sheet.missing?.length ?? 0,
    voided: context.voided,
    signedAt: sheet.signedAt?.toISOString() ?? '',
  };
}
