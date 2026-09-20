import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ConsentContext, type ConsentState } from './consent-context';
import {
  ACCEPT_ALL,
  REJECT_ALL,
  readConsent,
  writeConsent,
  type ConsentCategory,
  type ConsentChoice,
  type ConsentSelection,
} from './consent-storage';

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ConsentChoice | null>(readConsent);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const save = useCallback((selection: ConsentSelection) => {
    setChoice(writeConsent(selection));
    setSettingsOpen(false);
  }, []);

  const value = useMemo<ConsentState>(
    () => ({
      choice,
      settingsOpen,
      allows: (category: ConsentCategory) => choice?.[category] === true,
      acceptAll: () => save(ACCEPT_ALL),
      rejectAll: () => save(REJECT_ALL),
      save,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [choice, settingsOpen, save],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
