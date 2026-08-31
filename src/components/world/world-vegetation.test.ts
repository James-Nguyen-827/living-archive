import { describe, expect, it } from 'vitest';
import { WORLD_MAP } from './world-map';
import {
  VEGETATION_DEFINITIONS,
  buildVegetationGeometry,
  deformVegetationGeometry,
  estimateVegetationBudget,
  vegetationSwayOffset,
} from './world-vegetation';

const PLATFORM_FOR_PLANT = [
  'central-platform', 'central-platform', 'central-platform',
  'employment-platform', 'employment-platform',
  'writing-platform', 'writing-platform',
  'projects-platform', 'projects-platform',
  'interests-platform', 'interests-platform',
  'about-platform', 'about-platform',
] as const;

describe('authored world vegetation', () => {
  it('keeps the balanced five-pine and eight-shrub composition', () => {
    expect(VEGETATION_DEFINITIONS.filter(({ kind }) => kind === 'pine')).toHaveLength(5);
    expect(VEGETATION_DEFINITIONS.filter(({ kind }) => kind === 'shrub')).toHaveLength(8);
    expect(VEGETATION_DEFINITIONS).toHaveLength(13);
  });

  it('stays on its intended platforms and leaves the walking graph clear', () => {
    VEGETATION_DEFINITIONS.forEach(({ position }, index) => {
      const platform = WORLD_MAP.modules.find(({ id }) => id === PLATFORM_FOR_PLANT[index]);
      expect(platform, PLATFORM_FOR_PLANT[index]).toBeDefined();
      const [x, y, z] = position;
      const [platformX, platformY, platformZ] = platform!.transform.position;
      expect(Math.abs(x - platformX)).toBeLessThanOrEqual(platform!.size[0] / 2);
      expect(Math.abs(z - platformZ)).toBeLessThanOrEqual(platform!.size[2] / 2);
      expect(y).toBeCloseTo(platformY + platform!.size[1] / 2 + 0.125, 6);

      const closestNode = Math.min(...WORLD_MAP.nodes.map(({ position: node }) => (
        Math.hypot(x - node[0], z - node[2])
      )));
      expect(closestNode).toBeGreaterThanOrEqual(0.85);
    });
  });
});

describe('merged vegetation geometry', () => {
  it('builds distinct finite pine and shrub geometry with vertex colours', () => {
    const pine = buildVegetationGeometry([VEGETATION_DEFINITIONS.find(({ kind }) => kind === 'pine')!]);
    const shrub = buildVegetationGeometry([VEGETATION_DEFINITIONS.find(({ kind }) => kind === 'shrub')!]);

    for (const geometry of [pine, shrub]) {
      geometry.computeBoundingBox();
      expect(geometry.getAttribute('color')).toBeDefined();
      expect(geometry.getAttribute('position').count).toBeGreaterThan(0);
      expect(geometry.boundingBox?.min.toArray().every(Number.isFinite)).toBe(true);
      expect(geometry.boundingBox?.max.toArray().every(Number.isFinite)).toBe(true);
    }
    expect(pine.getAttribute('position').count).not.toBe(shrub.getAttribute('position').count);

    pine.dispose();
    shrub.dispose();
  });

  it('bounds animated displacement and restores the exact authored mesh for reduced motion', () => {
    const offset = vegetationSwayOffset(11.25, { x: 1, y: -1 }, 0.7, false);
    expect(Math.hypot(offset.x, offset.z)).toBeLessThanOrEqual(0.030001);
    expect(vegetationSwayOffset(11.25, { x: 1, y: -1 }, 0.7, true)).toEqual({ x: 0, z: 0 });

    const geometry = buildVegetationGeometry();
    const staticPositions = Float32Array.from(geometry.getAttribute('position').array);
    deformVegetationGeometry(geometry, 4.2, { x: 0.8, y: -0.6 }, false);
    expect(Array.from(geometry.getAttribute('position').array)).not.toEqual(Array.from(staticPositions));
    deformVegetationGeometry(geometry, 4.2, { x: 0.8, y: -0.6 }, true);
    expect(Array.from(geometry.getAttribute('position').array)).toEqual(Array.from(staticPositions));
    geometry.dispose();
  });

  it('adds one draw call and keeps its authored geometry compact', () => {
    const budget = estimateVegetationBudget();
    expect(budget.drawCalls).toBe(1);
    expect(budget.triangles).toBeGreaterThan(250);
    expect(budget.triangles).toBeLessThan(500);
  });
});
