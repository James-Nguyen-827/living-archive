import { describe, expect, it } from 'vitest';
import {
  mergedWindowParts,
  towerArchetypeFromModuleId,
  towerDesign,
  towerDesignEnvelope,
  type TowerArchetype,
} from './tower-designs';

const CASES: readonly [string, TowerArchetype, number][] = [
  ['work-tower', 'gearhouse', 2.5],
  ['notes-tower', 'pagewell', 4.5],
  ['experiments-tower', 'paradox-gate', 3.5],
  ['about-tower', 'orrery', 3.5],
];

describe('narrative tower designs', () => {
  it('maps the stable module ids to the new internal archetype names', () => {
    for (const [moduleId, archetype] of CASES) {
      expect(towerArchetypeFromModuleId(moduleId)).toBe(archetype);
    }
  });

  it('keeps every authored assembly inside the 1.8 unit horizontal envelope', () => {
    for (const [, archetype, height] of CASES) {
      const envelope = towerDesignEnvelope(towerDesign(archetype, height));
      expect(envelope.width, archetype).toBeLessThanOrEqual(1.8);
      expect(envelope.depth, archetype).toBeLessThanOrEqual(1.8);
    }
  });

  it('gives all four landmarks distinct three-dimensional proportions', () => {
    const signatures = CASES.map(([, archetype, height]) => {
      const envelope = towerDesignEnvelope(towerDesign(archetype, height));
      return [envelope.width, envelope.height, envelope.depth].map((value) => value.toFixed(2)).join(':');
    });

    expect(new Set(signatures).size).toBe(4);
  });

  it('authors warm window slits on every compass face of every tower', () => {
    for (const [, archetype, height] of CASES) {
      const design = towerDesign(archetype, height);
      expect(new Set(design.windows.map((window) => window.face))).toEqual(
        new Set(['north', 'east', 'south', 'west']),
      );

      const geometry = mergedWindowParts(design.windows);
      geometry.computeBoundingBox();
      expect(geometry.getAttribute('position').count).toBeGreaterThan(0);
      expect(geometry.boundingBox?.isEmpty()).toBe(false);
      geometry.dispose();
    }
  });
});
