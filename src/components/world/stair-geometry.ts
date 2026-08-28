import type { GridPoint, WalkNode, WorldModule } from './world-types';

export interface StairStep {
  position: GridPoint;
  size: GridPoint;
  top: number;
}

export function getStairSteps(
  module: WorldModule,
  nodes: readonly WalkNode[],
): readonly StairStep[] {
  const [firstId, secondId] = module.stairNodeIds ?? [];
  const first = nodes.find((node) => node.id === firstId);
  const second = nodes.find((node) => node.id === secondId);
  if (!first || !second) return [];

  const low = first.position[1] <= second.position[1] ? first : second;
  const high = low === first ? second : first;
  const transform = module.transform;
  const worldDirection: readonly [number, number] = [
    high.position[0] - low.position[0],
    high.position[2] - low.position[2],
  ];
  const angle = -transform.quarterTurns * Math.PI / 2;
  const localX = Math.round(worldDirection[0] * Math.cos(angle) + worldDirection[1] * Math.sin(angle));
  const localZ = Math.round(-worldDirection[0] * Math.sin(angle) + worldDirection[1] * Math.cos(angle));
  const rise = (high.position[1] - low.position[1]) / 4;
  const baseY = low.position[1];

  return [0, 1, 2, 3].map((index) => {
    const runOffset = -0.375 + index * 0.25;
    const top = low.position[1] + 0.25 + rise * (index + 1);
    const height = top - baseY;
    return {
      position: [localX * runOffset, baseY - transform.position[1] + height / 2, localZ * runOffset],
      size: localX === 0 ? [1, height, 0.25] : [0.25, height, 1],
      top,
    } satisfies StairStep;
  });
}
