export type StorageCategory = 'Necessary' | 'Preferences' | 'Third-party services';

export interface StorageItem {
  name: string;
  type: 'Cookie' | 'Local storage' | 'Third-party script';
  category: StorageCategory;
  purpose: string;
  duration: string;
}

export const POLICY_UPDATED = '2026-09-20';

export const STORAGE_INVENTORY: readonly StorageItem[] = [
  {
    name: 'bendike_consent',
    type: 'Cookie',
    category: 'Necessary',
    purpose: 'Remembers the choice you made in the cookie bar, and when you made it.',
    duration: '12 months',
  },
  {
    name: 'bendike.token',
    type: 'Local storage',
    category: 'Necessary',
    purpose: 'Keeps you signed in to your Bendike account.',
    duration: 'Until you log out',
  },
  {
    name: 'bendike.locale',
    type: 'Local storage',
    category: 'Necessary',
    purpose: 'Remembers the language you chose for the shop and the services.',
    duration: 'Until you clear your browser data',
  },
  {
    name: 'bendike.gear.view',
    type: 'Local storage',
    category: 'Preferences',
    purpose: 'Remembers whether you look at your gear as a grid or as cards.',
    duration: 'Until you clear your browser data or withdraw permission',
  },
  {
    name: 'bendike.currency',
    type: 'Local storage',
    category: 'Preferences',
    purpose: 'Remembers the currency you chose for prices (US$, AR$ or R$).',
    duration: 'Until you clear your browser data or withdraw permission',
  },
  {
    name: 'bendike.riggerLicence',
    type: 'Local storage',
    category: 'Preferences',
    purpose: 'For riggers: fills in the licence number you typed on your last packing sheet.',
    duration: 'Until you clear your browser data or withdraw permission',
  },
  {
    name: 'Google Identity Services (accounts.google.com)',
    type: 'Third-party script',
    category: 'Third-party services',
    purpose:
      'Only when you allow it and open the login or sign-up page: lets you continue with Google. Google may set its own cookies.',
    duration: "Set by Google; see Google's privacy policy",
  },
  {
    name: 'YouTube, Spotify and Vimeo players (youtube-nocookie.com, open.spotify.com, player.vimeo.com)',
    type: 'Third-party script',
    category: 'Third-party services',
    purpose:
      'Only when you allow it and press play on a Learn page: shows the video or podcast player inside Bendike. The provider may set its own cookies.',
    duration: 'Set by the provider; see its privacy policy',
  },
];
