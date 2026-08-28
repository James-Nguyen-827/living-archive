import { describe, expect, it } from 'vitest';
import type { WalkNode } from './world-types';
import { findPath } from './pathfinding';

const node = (id: string, position: WalkNode['position'], neighbors: readonly string[]): WalkNode => ({
  id,
  position,
  surfaceId: 'test',
  neighbors,
  protectedEdges: ['north', 'east', 'south', 'west'],
});

describe('findPath', () => {
  it('returns the shortest route instead of the first longer route discovered', () => {
    const nodes = [
      node('start', [0, 0, 0], ['long-a', 'short']),
      node('long-a', [1, 0, 0], ['start', 'long-b']),
      node('long-b', [2, 0, 0], ['long-a', 'goal']),
      node('short', [0, 0, 1], ['start', 'goal']),
      node('goal', [1, 0, 1], ['long-b', 'short']),
    ];

    expect(findPath(nodes, 'start', 'goal')).toEqual(['start', 'short', 'goal']);
  });

  it('returns an empty route when the destination is unreachable', () => {
    const nodes = [node('start', [0, 0, 0], []), node('goal', [4, 0, 0], [])];

    expect(findPath(nodes, 'start', 'goal')).toEqual([]);
  });

  it('returns the current node when the traveler is already at the destination', () => {
    const nodes = [node('start', [0, 0, 0], [])];

    expect(findPath(nodes, 'start', 'start')).toEqual(['start']);
  });
});
