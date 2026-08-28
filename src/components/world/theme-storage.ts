import type { WorldState } from './world-types';

export const THEME_STORAGE_KEY = 'portfolio-theme';

export function readTheme(storage: Pick<Storage, 'getItem'> = localStorage): WorldState['theme'] {
  try {
    const value = storage.getItem(THEME_STORAGE_KEY);
    return value === 'night' ? 'night' : 'day';
  } catch {
    return 'day';
  }
}

export function writeTheme(theme: WorldState['theme'], storage: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in privacy modes; the in-memory theme still works.
  }
}

