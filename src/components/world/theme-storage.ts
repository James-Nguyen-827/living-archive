import { THEME_STORAGE_KEY, type PortfolioTheme } from '../../config/theme';

export function readTheme(storage: Pick<Storage, 'getItem'> = localStorage): PortfolioTheme {
  try {
    const value = storage.getItem(THEME_STORAGE_KEY);
    return value === 'night' ? 'night' : 'day';
  } catch {
    return 'day';
  }
}

export function writeTheme(theme: PortfolioTheme, storage: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in privacy modes; the in-memory theme still works.
  }
}
