import { describe, expect, it } from 'vitest';
import type { CardinalDirection, WalkNode, WorldMap, WorldModule, ZoneId } from './world-types';
import { validateWorld } from './world-validator';

const GUARDS: readonly CardinalDirection[] = ['north', 'east', 'south', 'west'];

function makeValidWorld(): WorldMap & { modules: WorldModule[]; nodes: WalkNode[] } {
  const zones: readonly ZoneId[] = ['work', 'field-notes', 'experiments', 'hobbies', 'about'];
  const positions: Record<ZoneId, WalkNode['position']> = {
    work: [1, 0, 0], 'field-notes': [-1, 0, 0], experiments: [0, 0, 1],
    hobbies: [0, 0, -1], about: [2, 0, 0],
  };
  const center: WalkNode = {
    id: 'spawn', position: [0, 0, 0], surfaceId: 'base',
    neighbors: zones.slice(0, 4).map((zone) => `zone-${zone}`), protectedEdges: GUARDS,
  };
  const nodes = zones.map<WalkNode>((zone) => ({
    id: `zone-${zone}`, position: positions[zone], surfaceId: 'base', zone,
    neighbors: zone === 'about' ? ['zone-work'] : zone === 'work' ? ['spawn', 'zone-about'] : ['spawn'],
    protectedEdges: GUARDS,
  }));
  return {
    spawnNodeId: 'spawn',
    modules: [{ id: 'base', kind: 'platform', size: [12, 1, 8], transform: { position: [0, 0, 0], quarterTurns: 0 } }],
    nodes: [center, ...nodes],
  };
}

describe('validateWorld stable graph', () => {
  it('accepts a square, guarded, connected world', () => {
    expect(validateWorld(makeValidWorld())).toEqual([]);
  });

  it('rejects fractional positions and unsupported module rotations', () => {
    const fractional = makeValidWorld();
    fractional.modules[0].transform.position = [0.25, 0, 0];
    expect(validateWorld(fractional)).toContainEqual(expect.objectContaining({ code: 'fractional-grid' }));

    const rotated = makeValidWorld();
    rotated.modules[0].transform.quarterTurns = 4 as 0;
    expect(validateWorld(rotated)).toContainEqual(expect.objectContaining({ code: 'unsupported-rotation' }));
  });

  it('accepts half-unit elevations but rejects quarter-unit positions', () => {
    const valid = makeValidWorld();
    valid.nodes[1].position = [1, 0.5, 0];
    expect(validateWorld(valid).some((issue) => issue.code === 'fractional-grid')).toBe(false);

    const invalid = makeValidWorld();
    invalid.nodes[1].position = [1, 0.25, 0];
    expect(validateWorld(invalid)).toContainEqual(expect.objectContaining({ code: 'fractional-grid' }));
  });

  it('rejects one-way or skipped traversal edges', () => {
    const oneWay = makeValidWorld();
    oneWay.nodes[1].neighbors = [];
    expect(validateWorld(oneWay)).toContainEqual(expect.objectContaining({ code: 'asymmetric-edge' }));

    const skipped = makeValidWorld();
    skipped.nodes[1].position = [3, 0, 0];
    expect(validateWorld(skipped)).toContainEqual(expect.objectContaining({ code: 'invalid-walk-edge' }));
  });

  it('rejects missing surfaces, detached nodes, and exposed edges', () => {
    const missing = makeValidWorld();
    missing.nodes[1].surfaceId = 'missing';
    expect(validateWorld(missing)).toContainEqual(expect.objectContaining({ code: 'missing-surface' }));

    const detached = makeValidWorld();
    detached.nodes[1].position = [20, 0, 0];
    expect(validateWorld(detached)).toContainEqual(expect.objectContaining({ code: 'detached-node' }));

    const exposed = makeValidWorld();
    exposed.nodes.find((node) => node.zone === 'about')!.protectedEdges = ['east', 'south', 'west'];
    expect(validateWorld(exposed)).toContainEqual(expect.objectContaining({ code: 'unprotected-edge' }));
  });

  it('rejects invalid stairs and bridge spans', () => {
    const stair = makeValidWorld();
    stair.nodes[1].position = [2, 2, 0];
    stair.modules.push({
      id: 'bad-stair', kind: 'stair', size: [1, 1, 1],
      transform: { position: [1, 0, 0], quarterTurns: 0 }, stairNodeIds: ['spawn', stair.nodes[1].id],
    });
    expect(validateWorld(stair)).toContainEqual(expect.objectContaining({ code: 'invalid-stair' }));

    const bridge = makeValidWorld();
    bridge.modules.push({
      id: 'bad-bridge', kind: 'bridge', size: [1, 0.25, 1],
      transform: { position: [1, 2, 2], quarterTurns: 0 }, bridgeNodeIds: ['spawn', bridge.nodes[3].id],
    });
    expect(validateWorld(bridge)).toContainEqual(expect.objectContaining({ code: 'bridge-endpoint' }));
  });

  it('rejects duplicate ids and rotated structural overlaps', () => {
    const duplicate = makeValidWorld();
    duplicate.modules.push({ ...duplicate.modules[0], size: [2, 0.25, 2] });
    expect(validateWorld(duplicate)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'duplicate-id' }), expect.objectContaining({ code: 'overlap' }),
    ]));

    const overlap = makeValidWorld();
    overlap.modules = [
      { id: 'long', kind: 'tower', size: [4, 1, 1], transform: { position: [0, 2, 0], quarterTurns: 1 } },
      { id: 'neighbor', kind: 'tower', size: [1, 1, 1], transform: { position: [0, 2, 1], quarterTurns: 0 } },
    ];
    expect(validateWorld(overlap)).toContainEqual(expect.objectContaining({ code: 'overlap' }));
  });

  it('rejects any zone disconnected from the stable graph', () => {
    const world = makeValidWorld();
    world.nodes.find((node) => node.zone === 'about')!.neighbors = [];
    expect(validateWorld(world)).toContainEqual(expect.objectContaining({ code: 'unreachable-zone', detail: expect.stringContaining('about') }));
  });
});
