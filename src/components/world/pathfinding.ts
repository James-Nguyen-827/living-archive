import type { WalkNode } from './world-types';

function distance(a: WalkNode, b: WalkNode): number {
  const [ax, ay, az] = a.position;
  const [bx, by, bz] = b.position;
  return Math.hypot(ax - bx, ay - by, az - bz);
}

function reconstructPath(previous: ReadonlyMap<string, string>, goalId: string): string[] {
  const path = [goalId];
  let cursor = goalId;
  while (previous.has(cursor)) {
    cursor = previous.get(cursor)!;
    path.unshift(cursor);
  }
  return path;
}

export function findPath(nodes: readonly WalkNode[], startId: string, goalId: string): string[] {
  if (startId === goalId) return [startId];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const start = byId.get(startId);
  const goal = byId.get(goalId);
  if (!start || !goal) return [];

  const open = new Set([startId]);
  const previous = new Map<string, string>();
  const routeCost = new Map<string, number>([[startId, 0]]);
  const estimatedCost = new Map<string, number>([[startId, distance(start, goal)]]);

  while (open.size > 0) {
    const currentId = [...open].reduce((bestId, candidateId) =>
      (estimatedCost.get(candidateId) ?? Number.POSITIVE_INFINITY)
        < (estimatedCost.get(bestId) ?? Number.POSITIVE_INFINITY)
        ? candidateId
        : bestId,
    );
    if (currentId === goalId) return reconstructPath(previous, goalId);
    open.delete(currentId);
    const current = byId.get(currentId)!;
    for (const neighborId of current.neighbors) {
      const neighbor = byId.get(neighborId);
      if (!neighbor) continue;
      const tentativeCost = (routeCost.get(currentId) ?? Number.POSITIVE_INFINITY) + distance(current, neighbor);
      if (tentativeCost >= (routeCost.get(neighborId) ?? Number.POSITIVE_INFINITY)) continue;
      previous.set(neighborId, currentId);
      routeCost.set(neighborId, tentativeCost);
      estimatedCost.set(neighborId, tentativeCost + distance(neighbor, goal));
      open.add(neighborId);
    }
  }
  return [];
}
