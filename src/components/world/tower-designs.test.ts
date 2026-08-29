import { describe, expect, it } from 'vitest';
import {
  estimateTowerDesignBudget,
  mergedWindowParts,
  towerArchetypeFromModuleId,
  towerDesign,
  towerDesignEnvelope,
  type TowerArchetype,
} from './tower-designs';

const CASES: readonly [string, TowerArchetype, number][] = [
  ['work-tower', 'project-court', 2.5],
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

  it('builds the Project Court from two project slabs and one coral bridge', () => {
    const design = towerDesign('project-court', 2.5);

    expect(Object.keys(design.assemblies)).toEqual([
      'rear-slab',
      'front-slab',
      'coral-bridge',
    ]);
    expect(design.assemblies['coral-bridge']?.parts.every((part) => part.tone === 'coral')).toBe(true);

    const envelope = towerDesignEnvelope(design);
    expect(envelope.width).toBeLessThanOrEqual(1.8);
    expect(envelope.depth).toBeLessThanOrEqual(1.8);
    expect(envelope.height).toBeLessThanOrEqual(2.85);
  });

  it('keeps the Project Court within the previous Gearhouse scene allowance', () => {
    const budget = estimateTowerDesignBudget('project-court', 2.5);

    expect(budget.drawCalls).toBeLessThanOrEqual(8);
    expect(budget.triangles).toBeLessThanOrEqual(324);
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
