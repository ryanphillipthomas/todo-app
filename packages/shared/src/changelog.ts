export type ChangeType = 'feature' | 'improvement' | 'fix';

export interface ChangeEntry {
  type: ChangeType;
  text: string;
}

export interface Release {
  version: string;
  date: string;
  changes: ChangeEntry[];
}

export const releases: Release[] = [
  {
    version: '1.3.0',
    date: '2026-04-19',
    changes: [
      { type: 'fix', text: 'Dev login now works regardless of which port Vite picks' },
      { type: 'fix', text: 'Adding todos no longer fails after fresh install' },
      { type: 'improvement', text: 'Login button shows errors instead of failing silently' },
      { type: 'improvement', text: 'Loading state on sign-in button prevents double-tap' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-04-19',
    changes: [
      { type: 'feature', text: 'Sign in with Apple on iOS and web' },
      { type: 'feature', text: 'Your todos are now private to your account' },
      { type: 'improvement', text: 'Tokens stored securely in Keychain on iOS' },
      { type: 'improvement', text: 'Sessions restore automatically on launch' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-04-19',
    changes: [
      { type: 'feature', text: 'Real-time sync — changes appear instantly across all devices' },
      { type: 'feature', text: 'Todos are now persisted across sessions' },
      { type: 'improvement', text: 'Connection status banner when offline or reconnecting' },
      { type: 'improvement', text: 'Auto-reconnect with backoff if connection drops' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-04-19',
    changes: [
      { type: 'feature', text: 'Add, complete, and delete todos' },
      { type: 'feature', text: 'Available on web and iOS' },
      { type: 'improvement', text: 'Incomplete todos sorted before completed' },
    ],
  },
];

export const currentVersion = releases[0].version;

export const typeLabel: Record<ChangeType, string> = {
  feature: 'New',
  improvement: 'Improved',
  fix: 'Fixed',
};
