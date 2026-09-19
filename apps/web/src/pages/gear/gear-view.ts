export type GearView = 'grid' | 'cards';

export const GEAR_VIEW_KEY = 'bendike.gear.view';

export function readGearView(): GearView {
  try {
    return localStorage.getItem(GEAR_VIEW_KEY) === 'cards' ? 'cards' : 'grid';
  } catch {
    return 'grid';
  }
}

export function saveGearView(view: GearView): void {
  try {
    localStorage.setItem(GEAR_VIEW_KEY, view);
  } catch {
    return;
  }
}
