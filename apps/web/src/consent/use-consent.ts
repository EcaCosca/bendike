import { useContext } from 'react';
import { ConsentContext } from './consent-context';

export function useConsent() {
  return useContext(ConsentContext);
}
