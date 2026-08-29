import type { WorldMap } from './world-types';
import {
  estimateTowerDesignBudget,
  towerArchetypeFromModuleId,
} from './tower-designs';
import {
  estimateVegetationBudget,
  VEGETATION_DEFINITIONS,
  type VegetationDefinition,
} from './world-vegetation';

export interface SceneBudgetEstimate {
  drawCalls: number;
  triangles: number;
}

export function estimateSceneBudget(
  world: WorldMap,
  vegetation: readonly VegetationDefinition[] = VEGETATION_DEFINITIONS,
): SceneBudgetEstimate {
  let boxMeshes = 0;
  let otherMeshes = 0;
  let towerDrawCalls = 0;
  let towerTriangles = 0;

  for (const module of world.modules) {
    if (module.kind === 'stair') boxMeshes += 1;
    else if (module.kind === 'tower') {
      const budget = estimateTowerDesignBudget(
        towerArchetypeFromModuleId(module.id),
        module.size[1],
      );
      towerDrawCalls += budget.drawCalls;
      towerTriangles += budget.triangles;
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

  const vegetationBudget = estimateVegetationBudget(vegetation);
  const instancedCalls = 2;
  const ruinMeshes = 4;
  const carouselCalls = 12;
  const carouselTriangles = 760;
  const travelerCalls = 2;
  const shadowGroundCalls = 1;
  const seaPlaneCalls = 1;
  const landingPadCalls = 2;
  const drawCalls = boxMeshes + otherMeshes + towerDrawCalls + instancedCalls + vegetationBudget.drawCalls + carouselCalls + travelerCalls + shadowGroundCalls + seaPlaneCalls + landingPadCalls;
  const triangles = boxMeshes * 12 + otherMeshes * 20 + towerTriangles + vegetationBudget.triangles + ruinMeshes * 12 + carouselTriangles + 120;
  return { drawCalls, triangles };
}
