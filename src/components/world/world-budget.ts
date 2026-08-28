import type { WorldMap } from './world-types';

export interface SceneBudgetEstimate {
  drawCalls: number;
  triangles: number;
}

export function estimateSceneBudget(world: WorldMap, treeCount = 0): SceneBudgetEstimate {
  let boxMeshes = 0;
  let otherMeshes = 0;

  for (const module of world.modules) {
    if (module.kind === 'stair') boxMeshes += 1;
    else if (module.kind === 'tower') {
      boxMeshes += 4;
      otherMeshes += 2;
    } else if (module.kind === 'bridge') boxMeshes += 3;
    else if (module.kind === 'water') boxMeshes += 4;
    else if (module.kind === 'platform') {
      boxMeshes += 2;
      if (
        module.transform.position[1] >= 0.5
        && module.size[0] >= 3
        && module.size[2] >= 3
      ) boxMeshes += 4;
    } else if (module.kind === 'ruin') boxMeshes += 2;
    else boxMeshes += 1;
  }

  const instancedCalls = (treeCount > 0 ? 3 : 0) + 2;
  const ruinMeshes = 4;
  const carouselCalls = 12;
  const carouselTriangles = 760;
  const travelerCalls = 2;
  const shadowGroundCalls = 1;
  const seaPlaneCalls = 1;
  const drawCalls = boxMeshes + otherMeshes + instancedCalls + carouselCalls + travelerCalls + shadowGroundCalls + seaPlaneCalls;
  const triangles = boxMeshes * 12 + otherMeshes * 20 + treeCount * 28 + ruinMeshes * 12 + carouselTriangles + 120;
  return { drawCalls, triangles };
}
