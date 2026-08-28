import { describe, expect, it } from 'vitest';
import { estimateSceneBudget } from './world-budget';
import { WORLD_MAP } from './world-map';

describe('world performance budget', () => {
  it('stays below the authored desktop and mobile scene limits', () => {
    const budget = estimateSceneBudget(WORLD_MAP);
    expect(budget.drawCalls).toBeLessThanOrEqual(100);
    expect(budget.triangles).toBeLessThanOrEqual(75_000);
  });
});

