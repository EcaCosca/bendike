import { createContext, useContext } from 'react';

export const GoogleClientIdContext = createContext<string | undefined>(undefined);

export function useGoogleClientId(): string | undefined {
  return useContext(GoogleClientIdContext);
}
