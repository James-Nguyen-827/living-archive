import { describe, expect, it } from 'vitest';
import { findPath } from './pathfinding';
import { towerDesign, towerDesignEnvelope } from './tower-designs';
import { WORLD_MAP, WORLD_REACTIONS, ZONE_NODES } from './world-map';
import { validateWorld } from './world-validator';

function platformBounds(platform: { transform: { position: readonly number[] }; size: readonly number[] }) {
  const [centerX, , centerZ] = platform.transform.position;
  const [sizeX, , sizeZ] = platform.size;
  return {
    west: centerX - sizeX / 2,
    east: centerX + sizeX / 2,
    north: centerZ - sizeZ / 2,
    south: centerZ + sizeZ / 2,
  };
}

function towerFootprintBounds(
  tower: { transform: { position: readonly number[]; quarterTurns: number } },
  envelope: { width: number; depth: number },
) {
  const [anchorX, , anchorZ] = tower.transform.position;
  const halfWidth = (tower.transform.quarterTurns % 2 === 1 ? envelope.depth : envelope.width) / 2;
  const halfDepth = (tower.transform.quarterTurns % 2 === 1 ? envelope.width : envelope.depth) / 2;
  return {
    west: anchorX - halfWidth,
    east: anchorX + halfWidth,
    north: anchorZ - halfDepth,
    south: anchorZ + halfDepth,
  };
}

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

  it('keeps Project Court centered on the work platform so the traveler arrives inside the courtyard', () => {
    const platform = WORLD_MAP.modules.find((module) => module.id === 'work-platform');
    const tower = WORLD_MAP.modules.find((module) => module.id === 'work-tower');
    const workZone = WORLD_MAP.nodes.find((node) => node.id === 'work-zone');
    expect(platform).toBeDefined();
    expect(tower).toBeDefined();
    expect(workZone).toBeDefined();

    expect(tower!.transform.position).toEqual([-7, 0, 0]);
    expect(tower!.transform.quarterTurns).toBe(1);
    expect(workZone!.position[0]).toBe(tower!.transform.position[0]);
    expect(workZone!.position[2]).toBe(tower!.transform.position[2]);

    const envelope = towerDesignEnvelope(towerDesign('project-court', tower!.size[1]));
    const platformEdge = platformBounds(platform!);
    const footprint = towerFootprintBounds(tower!, envelope);
    const minMargin = 0.5;

    expect(footprint.west - platformEdge.west).toBeGreaterThanOrEqual(minMargin);
    expect(footprint.north - platformEdge.north).toBeGreaterThanOrEqual(minMargin);
    expect(platformEdge.east - footprint.east).toBeGreaterThanOrEqual(minMargin);
    expect(platformEdge.south - footprint.south).toBeGreaterThanOrEqual(minMargin);
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
