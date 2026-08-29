import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  buildLandingPadPatternGeometry,
  buildLandingPadStructureGeometry,
  landingPadGlowRegionCount,
  LANDING_PAD_CENTER_SIZE,
  LANDING_PAD_DECK_SIZE,
  LANDING_PAD_FOOTPRINT_SIZE,
  LANDING_PAD_FRAME_INSET,
  LANDING_PAD_FRAME_WIDTH,
  LANDING_PAD_STAIR_STEPS,
  LANDING_PAD_STAIR_TOTAL_RUN,
} from './landing-pad-pattern';

describe('landing pad compass frame', () => {
  it('authors five glow regions: four frame sides and one center square', () => {
    expect(landingPadGlowRegionCount()).toBe(5);
    expect(LANDING_PAD_FRAME_INSET).toBe(0.1);
    expect(LANDING_PAD_FRAME_WIDTH).toBe(0.08);
    expect(LANDING_PAD_CENTER_SIZE).toBe(0.22);
  });

  it('builds flat glow quads for the frame and center', () => {
    const pattern = buildLandingPadPatternGeometry();
    expect(pattern.groups).toHaveLength(0);
    expect(pattern.getAttribute('position').count).toBe(30);
    pattern.dispose();
  });

  it('faces the compass frame upward for the orthographic camera', () => {
    const pattern = buildLandingPadPatternGeometry();
    const normal = new Vector3();
    pattern.computeVertexNormals();
    normal.fromBufferAttribute(pattern.getAttribute('normal'), 0);
    expect(normal.y).toBeGreaterThan(0.9);
    pattern.dispose();
  });

  it('wraps four stair rings with corner pieces', () => {
    expect(LANDING_PAD_STAIR_STEPS).toBe(4);
    expect(LANDING_PAD_STAIR_TOTAL_RUN).toBeCloseTo(0.28);
    const structure = buildLandingPadStructureGeometry();
    expect(structure.getAttribute('position').count).toBeGreaterThan(36 * 3);
    structure.dispose();
  });

  it('keeps the deck square smaller than the stair footprint', () => {
    expect(LANDING_PAD_DECK_SIZE).toBeLessThan(LANDING_PAD_FOOTPRINT_SIZE);
  });
});
