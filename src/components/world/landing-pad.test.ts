import { MeshLambertMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import {
  LANDING_PAD,
  LANDING_PAD_TILE,
  TOWER_WINDOW,
  TOWER_WINDOW_NIGHT_COLOR,
  updateLandingPadFrameLambert,
} from './world-materials';
import { towerWindowGlow } from './world-motion';
import {
  landingPadGlowRegionCount,
  LANDING_PAD_FOOTPRINT_SIZE,
} from './landing-pad-pattern';
import { WORLD_MAP } from './world-map';

function padBounds() {
  const half = LANDING_PAD_FOOTPRINT_SIZE / 2;
  return {
    west: -half,
    east: half,
    north: -half,
    south: half,
  };
}

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

describe('spawn landing pad', () => {
  it('uses tower window glow strength at night', () => {
    expect(towerWindowGlow(0, false, false, false)).toBeCloseTo(0.16);
    expect(towerWindowGlow(0, true, false, false)).toBeGreaterThan(0.7);
    expect(towerWindowGlow(0, true, false, true)).toBeCloseTo(0.8);
  });

  it('drives warm emissive from tower window colour at night', () => {
    const material = new MeshLambertMaterial({ color: TOWER_WINDOW.day });
    updateLandingPadFrameLambert(material, { nightMix: 1, glow: 0.8 });
    expect(material.emissive.getHexString()).toBe(TOWER_WINDOW_NIGHT_COLOR.getHexString());
    expect(material.emissiveIntensity).toBeGreaterThan(1);
    updateLandingPadFrameLambert(material, { nightMix: 0, glow: 0 });
    expect(material.emissiveIntensity).toBe(0);
  });

  it('authors a habitat compass frame with tower window colours', () => {
    expect(landingPadGlowRegionCount()).toBe(5);
    expect(LANDING_PAD.day).toBe('#E8E0D0');
    expect(LANDING_PAD_TILE).toBe(TOWER_WINDOW);
    expect(LANDING_PAD_TILE.night).toBe('#ffd35c');
  });

  it('fits inside the central platform', () => {
    const platform = WORLD_MAP.modules.find((module) => module.id === 'central-platform');
    expect(platform).toBeDefined();

    const pad = padBounds();
    const platformEdge = platformBounds(platform!);
    expect(pad.west).toBeGreaterThanOrEqual(platformEdge.west);
    expect(pad.east).toBeLessThanOrEqual(platformEdge.east);
    expect(pad.north).toBeGreaterThanOrEqual(platformEdge.north);
    expect(pad.south).toBeLessThanOrEqual(platformEdge.south);
  });

  it('leaves cardinal walk nodes on the moss perimeter outside the stair footprint', () => {
    const pad = padBounds();
    const cardinalNodes = WORLD_MAP.nodes.filter((node) =>
      node.id !== 'spawn'
      && node.position[1] === 0
      && (Math.abs(node.position[0]) === 1 || Math.abs(node.position[2]) === 1)
      && node.surfaceId === 'central-platform',
    );
    expect(cardinalNodes.length).toBeGreaterThan(0);
    for (const node of cardinalNodes) {
      const [x, , z] = node.position;
      const insideInterior = Math.abs(x) < pad.east && Math.abs(z) < pad.south;
      expect(insideInterior).toBe(false);
    }
  });
});
