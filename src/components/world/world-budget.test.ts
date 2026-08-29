import { describe, expect, it } from 'vitest';
import { estimateSceneBudget } from './world-budget';
import { WORLD_MAP } from './world-map';
import {
  estimateTowerDesignBudget,
  towerArchetypeFromModuleId,
} from './tower-designs';
import { estimateVegetationBudget } from './world-vegetation';

describe('world performance budget', () => {
  it('stays below the authored desktop and mobile scene limits', () => {
    const budget = estimateSceneBudget(WORLD_MAP);
    expect(budget.drawCalls).toBeLessThanOrEqual(100);
    expect(budget.triangles).toBeLessThanOrEqual(75_000);
  });

  it('accounts for each authored tower assembly instead of a generic tower allowance', () => {
    const withoutTowers = {
      ...WORLD_MAP,
      modules: WORLD_MAP.modules.filter((module) => module.kind !== 'tower'),
    };
    const towerBudget = WORLD_MAP.modules
      .filter((module) => module.kind === 'tower')
      .map((module) => estimateTowerDesignBudget(
        towerArchetypeFromModuleId(module.id),
        module.size[1],
      ))
      .reduce((total, budget) => ({
        drawCalls: total.drawCalls + budget.drawCalls,
        triangles: total.triangles + budget.triangles,
      }), { drawCalls: 0, triangles: 0 });

    const full = estimateSceneBudget(WORLD_MAP);
    const base = estimateSceneBudget(withoutTowers);
    expect(full.drawCalls - base.drawCalls).toBe(towerBudget.drawCalls);
    expect(full.triangles - base.triangles).toBe(towerBudget.triangles);
    expect(towerBudget.drawCalls).toBeGreaterThan(24);
  });

  it('automatically includes the merged vegetation in the complete scene estimate', () => {
    const full = estimateSceneBudget(WORLD_MAP);
    const withoutVegetation = estimateSceneBudget(WORLD_MAP, []);
    const vegetation = estimateVegetationBudget();

    expect(full.drawCalls - withoutVegetation.drawCalls).toBe(vegetation.drawCalls);
    expect(full.triangles - withoutVegetation.triangles).toBe(vegetation.triangles);
    expect(full.drawCalls).toBeLessThanOrEqual(100);
    expect(full.triangles).toBeLessThanOrEqual(75_000);
  });
});
