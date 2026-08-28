import { describe, expect, it } from 'vitest';
import { findPath } from './pathfinding';
import { WORLD_MAP, WORLD_REACTIONS, ZONE_NODES } from './world-map';
import { validateWorld } from './world-validator';

describe('WORLD_MAP stable sculpture', () => {
  it('passes all deterministic geometry and connectivity checks', () => {
    expect(validateWorld(WORLD_MAP)).toEqual([]);
  });

  it('connects every island to every other island in one stable graph', () => {
    const zoneNodes = Object.values(ZONE_NODES);
    for (const start of zoneNodes) {
      for (const goal of zoneNodes) {
        expect(findPath(WORLD_MAP.nodes, start, goal).length).toBeGreaterThan(0);
      }
    }
  });

  it('uses one fixed square-grid transform and removes the central coral rail', () => {
    expect(WORLD_MAP.modules.some((module) => (module.kind as string) === 'rail')).toBe(false);
    for (const module of WORLD_MAP.modules) {
      expect([0, 1, 2, 3]).toContain(module.transform.quarterTurns);
      expect(Number.isInteger(module.transform.position[0])).toBe(true);
      expect(Number.isInteger(module.transform.position[1] * 2)).toBe(true);
      expect(Number.isInteger(module.transform.position[2])).toBe(true);
    }
  });

  it('authors one deterministic arrival reaction for every zone', () => {
    expect(WORLD_REACTIONS.map((reaction) => reaction.zone).sort()).toEqual([
      'about', 'experiments', 'field-notes', 'hobbies', 'work',
    ]);
    expect(new Set(WORLD_REACTIONS.map((reaction) => reaction.kind)).size).toBe(5);
  });

  it('binds every narrative tower to the shared 1.05 second arrival contract', () => {
    const towerByZone = new Map([
      ['work', 'work-tower'],
      ['field-notes', 'notes-tower'],
      ['experiments', 'experiments-tower'],
      ['about', 'about-tower'],
    ] as const);

    for (const [zone, towerId] of towerByZone) {
      const reaction = WORLD_REACTIONS.find((candidate) => candidate.zone === zone);
      expect(reaction?.moduleIds).toContain(towerId);
      expect(reaction?.durationMs).toBe(1_050);
    }
  });
});
