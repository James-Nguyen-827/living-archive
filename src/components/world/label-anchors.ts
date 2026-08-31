import { DECOR_GROUND_SNAP } from './world-materials';
import {
  towerArchetypeFromModuleId,
  towerDesign,
  towerDesignTopY,
} from './tower-designs';
import { WORLD_MAP } from './world-map';
import type { ZoneId } from './world-types';

/** Uniform gap between each sculpture's authored top and its label anchor. */
export const LABEL_CLEARANCE = 0.5;

const INTERESTS_CAROUSEL_POSITION: [number, number, number] = [0, -0.25, 7];
const INTERESTS_CAROUSEL_SCALE = 1.25;
/** Local-space top of the carousel canopy rim above the group origin. */
const INTERESTS_CAROUSEL_LOCAL_TOP = 1.52;

const ZONE_LABEL_MODULE: Record<Exclude<ZoneId, 'interests'>, string> = {
  employment: 'employment-tower',
  writing: 'writing-tower',
  projects: 'projects-tower',
  about: 'about-tower',
};

function towerPlacementY(moduleId: string): number {
  const module = WORLD_MAP.modules.find((item) => item.id === moduleId);
  if (!module) throw new Error(`Missing label module ${moduleId}`);
  return module.transform.position[1] - DECOR_GROUND_SNAP;
}

export function sculptureTopY(zone: ZoneId): number {
  if (zone === 'interests') {
    return INTERESTS_CAROUSEL_POSITION[1] + INTERESTS_CAROUSEL_LOCAL_TOP * INTERESTS_CAROUSEL_SCALE;
  }
  const moduleId = ZONE_LABEL_MODULE[zone];
  const module = WORLD_MAP.modules.find((item) => item.id === moduleId)!;
  const design = towerDesign(towerArchetypeFromModuleId(moduleId), module.size[1]);
  return towerPlacementY(moduleId) + towerDesignTopY(design);
}

export function zoneLabelAnchor(zone: ZoneId): [number, number, number] {
  if (zone === 'interests') {
    return [
      INTERESTS_CAROUSEL_POSITION[0],
      sculptureTopY(zone) + LABEL_CLEARANCE,
      INTERESTS_CAROUSEL_POSITION[2],
    ];
  }
  const moduleId = ZONE_LABEL_MODULE[zone];
  const module = WORLD_MAP.modules.find((item) => item.id === moduleId)!;
  const [x, , z] = module.transform.position;
  return [x, sculptureTopY(zone) + LABEL_CLEARANCE, z];
}
