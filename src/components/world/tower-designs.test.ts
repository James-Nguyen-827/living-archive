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
  ['notes-tower', 'index-engine', 4.5],
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

  it('builds the Project Court from two socketed terraces and one compact coral gantry', () => {
    const design = towerDesign('project-court', 2.5);

    expect(Object.keys(design.assemblies)).toEqual([
      'rear-slab',
      'front-slab',
      'coral-gantry',
    ]);
    const rearSocket = design.assemblies['rear-slab']?.parts.at(-1);
    const frontSocket = design.assemblies['front-slab']?.parts.at(-1);
    const gantry = design.assemblies['coral-gantry'];

    expect(rearSocket).toEqual({
      position: [0.08, 0.13, 0],
      size: [0.28, 0.1, 0.24],
      tone: 'structure',
    });
    expect(frontSocket).toEqual({
      position: [0, 0.13, 0.08],
      size: [0.28, 0.1, 0.24],
      tone: 'structure',
    });
    expect(gantry?.parts).toEqual([
      { position: [0, 0, 0], size: [0.18, 0.12, 1.29], tone: 'coral' },
      { position: [0, 0, -0.61], size: [0.28, 0.16, 0.16], tone: 'coral' },
      { position: [0, 0, 0.61], size: [0.28, 0.16, 0.16], tone: 'coral' },
    ]);
    expect(design.staticParts).toContainEqual({
      position: [-0.54, 2.08, -0.74],
      size: [0.3, 0.08, 0.28],
      tone: 'structure',
    });

    const envelope = towerDesignEnvelope(design);
    expect(envelope.width).toBeLessThanOrEqual(1.8);
    expect(envelope.depth).toBeLessThanOrEqual(1.8);
    expect(envelope.height).toBeLessThanOrEqual(2.85);
  });

  it('keeps the Project Court within the previous Gearhouse scene allowance', () => {
    const budget = estimateTowerDesignBudget('project-court', 2.5);

    expect(budget.drawCalls).toBe(8);
    expect(budget.triangles).toBe(324);
  });

  it('builds the Field Notes Index Engine from six instanced C-shaped pieces and one coral carriage', () => {
    const design = towerDesign('index-engine', 4.5);
    const keyedPieces = [
      'chamber-0',
      'chamber-1',
      'chamber-2',
      'chamber-3',
      'crown-half-0',
      'crown-half-1',
    ];

    expect(Object.keys(design.assemblies)).toEqual([
      ...keyedPieces,
      'coral-carriage',
    ]);
    expect(new Set(keyedPieces.map((key) => design.assemblies[key]?.instanceGroup))).toEqual(
      new Set(['index-engine-pieces']),
    );
    expect(keyedPieces.map((key) => design.assemblies[key]?.parts)).toEqual(
      Array.from({ length: keyedPieces.length }, () => design.assemblies['chamber-0']?.parts),
    );
    expect(design.assemblies['chamber-0']?.parts).toHaveLength(3);
    expect(design.assemblies['coral-carriage']?.parts.every((part) => part.tone === 'coral')).toBe(true);
    expect(design.staticParts.some((part) => part.size[0] > 1.3)).toBe(true);
    expect(design.staticParts.some((part) => part.size[1] > 3.5 && part.position[0] < 0)).toBe(true);
  });

  it('keeps the Index Engine inside its five-call scene allowance', () => {
    const design = towerDesign('index-engine', 4.5);
    const budget = estimateTowerDesignBudget('index-engine', 4.5);
    const envelope = towerDesignEnvelope(design);

    expect(budget.drawCalls).toBe(5);
    expect(budget.triangles).toBeLessThanOrEqual(720);
    expect(envelope.width).toBeLessThanOrEqual(1.8);
    expect(envelope.depth).toBeLessThanOrEqual(1.8);
    expect(envelope.height).toBeLessThanOrEqual(4.9);
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
