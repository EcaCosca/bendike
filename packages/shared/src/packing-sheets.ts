import type { LibraryDocumentView } from './library';
import type { OpenBulletinNotice } from './gear';

export const PACKING_CHECKLIST_VERSION = 'ciac-anac-1';

export interface ChecklistItem {
  id: string;
  column: 'left' | 'right';
  en: string;
  es: string;
}

export const PACKING_CHECKLIST: readonly ChecklistItem[] = [
  { id: 'main_lift_web', column: 'left', en: 'Main lift web', es: 'Cinta ppal carga' },
  { id: 'steering_lines_toggles', column: 'right', en: 'Steering lines and toggles', es: 'Comandos' },
  { id: 'chest_leg_straps', column: 'left', en: 'Chest & leg straps', es: 'Pecho y pierna' },
  { id: 'canopy_cells_crossports', column: 'right', en: 'Canopy cells & crossports', es: 'Celdas' },
  { id: 'harness_hardware', column: 'left', en: 'Harness hardware', es: 'Herrajes' },
  { id: 'slider_stops', column: 'right', en: 'Slider stops', es: 'Topes vela' },
  { id: 'three_ring_release', column: 'left', en: '3 ring release', es: 'Sistema 3 anillas' },
  { id: 'safety_stow', column: 'right', en: 'Safety stow', es: 'Elástico freebag' },
  { id: 'pilot_chute_boc', column: 'left', en: 'Pilot chute BOC', es: 'Pilotín BOC' },
  { id: 'bridle', column: 'right', en: 'Bridle', es: 'Brida' },
  {
    id: 'reserve_ripcord_pocket_housing',
    column: 'left',
    en: 'Reserve ripcord, pocket, housing',
    es: 'Reserva',
  },
  { id: 'pilot_chute', column: 'right', en: 'Pilot chute', es: 'Pilotín' },
  {
    id: 'cutaway_handle_pocket_housings',
    column: 'left',
    en: 'Cutaway handle, pocket, housings',
    es: 'Desprend',
  },
  {
    id: 'line_continuity_sequence',
    column: 'right',
    en: 'Line continuity / line sequence',
    es: 'Continuidad líneas / secuencia líneas',
  },
  {
    id: 'container_flaps_grommets',
    column: 'left',
    en: 'Container flaps and grommets',
    es: 'Flaps plásticos ojales',
  },
  { id: 'slider_position', column: 'right', en: 'Slider in the correct position', es: 'Slider posición correcta' },
  { id: 'closing_loops_length', column: 'left', en: 'Closing loop length, main & reserve', es: 'Largo loops' },
  {
    id: 'soft_links_tight',
    column: 'right',
    en: 'Link tight, soft link knot OK',
    es: 'Link ajustado, soft links nudo OK',
  },
  { id: 'sizes', column: 'left', en: 'Sizes', es: 'Medidas' },
  {
    id: 'steering_toggle_marks',
    column: 'right',
    en: 'Steering line at toggle mark',
    es: 'Steering line en toggle mark / marcas',
  },
  { id: 'risers', column: 'left', en: 'Risers', es: 'Risers' },
  {
    id: 'steering_lines_equal',
    column: 'right',
    en: 'Steering lines equal to each other',
    es: 'Steering line igual entre sí / simetría',
  },
  {
    id: 'connector_links_soft_links',
    column: 'left',
    en: 'Connector links & soft links',
    es: 'Conector links & soft links',
  },
  { id: 'packing_card', column: 'right', en: 'Packing card complete', es: 'Tarjeta completa' },
  { id: 'slider_grommets', column: 'left', en: 'Slider & grommets', es: 'Slider y ojales' },
  { id: 'packed_per_manual', column: 'right', en: 'Packed according to the manual', es: 'Plegado según manual' },
  { id: 'a_lines', column: 'left', en: 'A lines & attachments', es: 'Líneas A y uniones' },
  { id: 'reserve_pin_seal', column: 'right', en: 'Reserve pin & seal', es: 'Sello' },
  { id: 'b_lines', column: 'left', en: 'B lines & attachments', es: 'Líneas B y uniones' },
  { id: 'mard_hooked', column: 'right', en: 'MARD hooked up', es: 'MARD enganchado' },
  { id: 'c_lines', column: 'left', en: 'C lines & attachments', es: 'Líneas C y uniones' },
  { id: 'aad_functional_test', column: 'right', en: 'AAD functional test', es: 'Test funcional del AAD' },
  { id: 'd_lines', column: 'left', en: 'D lines & attachments', es: 'Líneas D y uniones' },
  { id: 'general_inspection', column: 'right', en: 'General inspection', es: 'Inspección general' },
  {
    id: 'service_bulletins_done',
    column: 'left',
    en: 'Service bulletins: container, reserve, AAD',
    es: 'Boletines de servicio: contenedor, reserva, AAD',
  },
  { id: 'logbook', column: 'right', en: 'Logbook', es: 'Libreta registro' },
];

export const PACKING_ELEMENT_KINDS = ['reserve', 'container', 'aad'] as const;
export type PackingElementKind = (typeof PACKING_ELEMENT_KINDS)[number];

export interface PackingElement {
  kind: PackingElementKind;
  manufacturer: string;
  model: string;
  serial: string | null;
  manufacturedOn: string | null;
}

export type PackingElements = Record<PackingElementKind, PackingElement | null>;

export type SheetProblem =
  | { code: 'item_unticked'; itemId: string }
  | { code: 'bulletins_not_checked' }
  | { code: 'mard_not_connected' }
  | { code: 'no_reserve' }
  | { code: 'no_container' }
  | { code: 'no_aad' };

const ITEM_INDEX = new Map(PACKING_CHECKLIST.map((item, index) => [item.id, index]));

export function sanitizeCheckedIds(ids: readonly string[]): string[] {
  return [...new Set(ids)]
    .filter((id) => ITEM_INDEX.has(id))
    .sort((a, b) => (ITEM_INDEX.get(a) as number) - (ITEM_INDEX.get(b) as number));
}

export function missingItems(checkedIds: readonly string[]): ChecklistItem[] {
  const checked = new Set(checkedIds);
  return PACKING_CHECKLIST.filter((item) => !checked.has(item.id));
}

export interface SheetState {
  checkedIds: readonly string[];
  bulletinsChecked: boolean | null;
  mardConnected: boolean | null;
  elements: PackingElements;
}

export function sheetProblems(state: SheetState): SheetProblem[] {
  const problems: SheetProblem[] = missingItems(state.checkedIds).map((item) => ({
    code: 'item_unticked',
    itemId: item.id,
  }));
  if (state.bulletinsChecked === false) problems.push({ code: 'bulletins_not_checked' });
  if (state.mardConnected === false) problems.push({ code: 'mard_not_connected' });
  if (state.elements.reserve === null) problems.push({ code: 'no_reserve' });
  if (state.elements.container === null) problems.push({ code: 'no_container' });
  if (state.elements.aad === null) problems.push({ code: 'no_aad' });
  return problems;
}

export function describeProblem(problem: SheetProblem): string {
  switch (problem.code) {
    case 'item_unticked':
      return `Not ticked: ${PACKING_CHECKLIST[ITEM_INDEX.get(problem.itemId) ?? 0]?.en ?? problem.itemId}`;
    case 'bulletins_not_checked':
      return 'Service bulletins not checked';
    case 'mard_not_connected':
      return 'MARD not connected';
    case 'no_reserve':
      return 'No reserve on the rig';
    case 'no_container':
      return 'No container on the rig';
    case 'no_aad':
      return 'No AAD on the rig';
  }
}

export interface SigningState extends SheetState {
  notes: string;
  riggerLicence: string;
  performedOn: string;
  today: string;
}

export function signingBlockers(state: SigningState): string[] {
  const blockers: string[] = [];
  if (state.bulletinsChecked === null) blockers.push('Say whether the service bulletins were checked');
  if (state.mardConnected === null) blockers.push('Say whether the MARD is connected');
  if (state.riggerLicence.trim() === '') blockers.push("Enter the rigger's licence number");
  if (state.performedOn > state.today) blockers.push('The work cannot be dated in the future');
  const problems = sheetProblems(state);
  if (problems.length > 0 && state.notes.trim() === '') {
    blockers.push(
      `The notes must explain what is missing: ${problems.length} ${problems.length === 1 ? 'item' : 'items'} to explain`,
    );
  }
  return blockers;
}

export interface PackingComponentInfo {
  kind: PackingElementKind;
  itemId: string;
  manufacturer: string;
  model: string;
  serial: string | null;
  manufacturedOn: string | null;
  modelId: string | null;
  bulletinsLink: { url: string; source: 'model' | 'manufacturer' } | null;
  openBulletins: OpenBulletinNotice[];
  manuals: LibraryDocumentView[];
}

export type PackingComponents = Record<PackingElementKind, PackingComponentInfo | null>;

export interface PackingSheetView {
  id: string;
  rigId: string;
  rigName: string;
  reserveItemId: string;
  ownerId: string;
  riggerId: string;
  riggerName: string;
  riggerLicence: string | null;
  status: 'draft' | 'signed';
  voided: boolean;
  voidReason: string | null;
  sheetNo: number | null;
  performedOn: string;
  checklistVersion: string;
  checkedIds: string[];
  bulletinsChecked: boolean | null;
  mardConnected: boolean | null;
  ownerName: string;
  ownerAddress: string;
  ownerPhone: string;
  ownerEmail: string;
  manualDocumentId: string | null;
  manualLabel: string | null;
  notes: string;
  elements: PackingElements | null;
  missing: SheetProblem[] | null;
  signedAt: string | null;
  entryId: string | null;
  ownerNotifiedAt: string | null;
  ownerNotifiedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PackingJobView {
  sheet: PackingSheetView;
  components: PackingComponents;
}

export interface PackingSheetSummary {
  id: string;
  rigId: string;
  rigName: string;
  reserveItemId: string;
  sheetNo: number;
  performedOn: string;
  riggerName: string;
  missingCount: number;
  voided: boolean;
  signedAt: string;
}

export interface SavePackingDraftRequestBody {
  performedOn?: string;
  checkedIds?: string[];
  bulletinsChecked?: boolean | null;
  mardConnected?: boolean | null;
  ownerName?: string;
  ownerAddress?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  manualDocumentId?: string | null;
  notes?: string;
}

export interface SignPackingSheetRequestBody {
  riggerLicence: string;
}

export interface VoidPackingSheetRequestBody {
  reason: string;
}

export interface SetBulletinsLinkRequestBody {
  url: string;
}
