export type PortfolioTheme = 'day' | 'night';

export const THEME_STORAGE_KEY = 'portfolio-theme';

export const THEME_COLORS = {
  day: '#ffffff',
  night: '#191919',
} as const satisfies Record<PortfolioTheme, string>;
