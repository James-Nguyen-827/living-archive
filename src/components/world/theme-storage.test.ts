import { beforeEach, describe, expect, it } from 'vitest';
import { readTheme, writeTheme } from './theme-storage';

describe('theme persistence', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };

  beforeEach(() => values.clear());

  it('uses day for a first visit or corrupted preference', () => {
    expect(readTheme(storage)).toBe('day');
    storage.setItem('portfolio-theme', 'sepia');
    expect(readTheme(storage)).toBe('day');
  });

  it('round-trips a visitor choice using the shared storage key', () => {
    writeTheme('night', storage);
    expect(storage.getItem('portfolio-theme')).toBe('night');
    expect(readTheme(storage)).toBe('night');
  });
});
