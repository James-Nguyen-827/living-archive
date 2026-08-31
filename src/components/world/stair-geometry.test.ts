import { describe, expect, it } from 'vitest';
import { WORLD_MAP } from './world-map';
import { getStairSteps } from './stair-geometry';

describe('getStairSteps', () => {
  it('joins the writing stair from the lower platform top to the raised bridge top', () => {
    const stair = WORLD_MAP.modules.find((module) => module.id === 'writing-stair')!;
    const steps = getStairSteps(stair, WORLD_MAP.nodes);

    expect(steps).toHaveLength(4);
    expect(steps.map((step) => step.top)).toEqual([0.375, 0.5, 0.625, 0.75]);
    expect(steps[0].position[2]).toBeGreaterThan(steps[3].position[2]);
  });

  it('reverses the run for a stair whose higher endpoint is toward positive Z', () => {
    const stair = WORLD_MAP.modules.find((module) => module.id === 'about-stair')!;
    const steps = getStairSteps(stair, WORLD_MAP.nodes);

    expect(steps[0].position[2]).toBeLessThan(steps[3].position[2]);
    expect(steps[3].top).toBe(1.25);
  });

  it('keeps lowered employment and interests stairs above the low endpoint', () => {
    for (const id of ['employment-stair', 'interests-stair'] as const) {
      const stair = WORLD_MAP.modules.find((module) => module.id === id)!;
      const steps = getStairSteps(stair, WORLD_MAP.nodes);

      expect(steps).toHaveLength(4);
      expect(steps.every((step) => step.size[1] > 0)).toBe(true);
      expect(steps.map((step) => step.top)).toEqual([-0.125, 0, 0.125, 0.25]);
    }
  });
});
