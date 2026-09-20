import { ACCEPT_ALL, REJECT_ALL, clearConsent, writeConsent } from '../../consent/consent-storage';
import { GEAR_VIEW_KEY, readGearView, saveGearView } from './gear-view';

describe('remembered gear view', () => {
  beforeEach(() => {
    clearConsent();
    localStorage.clear();
  });
  afterEach(() => clearConsent());

  test('is remembered when preferences are allowed', () => {
    writeConsent(ACCEPT_ALL);

    saveGearView('cards');

    expect(localStorage.getItem(GEAR_VIEW_KEY)).toBe('cards');
    expect(readGearView()).toBe('cards');
  });

  test('is neither written nor read when preferences are not allowed', () => {
    saveGearView('cards');
    expect(localStorage.getItem(GEAR_VIEW_KEY)).toBeNull();

    localStorage.setItem(GEAR_VIEW_KEY, 'cards');
    expect(readGearView()).toBe('grid');

    writeConsent(REJECT_ALL);
    expect(readGearView()).toBe('grid');
  });

  test('the grid is the default', () => {
    writeConsent(ACCEPT_ALL);

    expect(readGearView()).toBe('grid');
  });
});
