import { createContext } from 'react';
import type { ConsentCategory, ConsentChoice, ConsentSelection } from './consent-storage';

export interface ConsentState {
  choice: ConsentChoice | null;
  settingsOpen: boolean;
  allows: (category: ConsentCategory) => boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (selection: ConsentSelection) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const nothing = () => undefined;

export const ConsentContext = createContext<ConsentState>({
  choice: null,
  settingsOpen: false,
  allows: () => false,
  acceptAll: nothing,
  rejectAll: nothing,
  save: nothing,
  openSettings: nothing,
  closeSettings: nothing,
});
