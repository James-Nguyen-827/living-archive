import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Matrix4 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const LANDING_PAD_DECK_SIZE = 1.4;
export const LANDING_PAD_STAIR_STEPS = 4;
export const LANDING_PAD_STAIR_RUN = 0.07;
export const LANDING_PAD_STAIR_TOTAL_RUN = LANDING_PAD_STAIR_RUN * LANDING_PAD_STAIR_STEPS;
export const LANDING_PAD_RISE = 0.22;
export const LANDING_PAD_MOSS_TOP_Y = 0.25;
export const LANDING_PAD_FRAME_INSET = 0.1;
export const LANDING_PAD_FRAME_WIDTH = 0.08;
export const LANDING_PAD_CENTER_SIZE = 0.22;
/** Sits above the deck to avoid z-fighting. */
export const LANDING_PAD_PATTERN_LIFT = 0.018;

export const LANDING_PAD_FOOTPRINT_SIZE = LANDING_PAD_DECK_SIZE + LANDING_PAD_STAIR_TOTAL_RUN * 2;
export const LANDING_PAD_DECK_TOP_Y = LANDING_PAD_MOSS_TOP_Y + LANDING_PAD_RISE;
export const LANDING_PAD_DECK_CENTER_Y = LANDING_PAD_MOSS_TOP_Y + LANDING_PAD_RISE / 2;
export const LANDING_PAD_STEP_RISE = LANDING_PAD_RISE / LANDING_PAD_STAIR_STEPS;

function pushQuad(
  positions: number[],
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y: number,
): void {
  // Counter-clockwise from +Y so the frame reads from the orthographic camera above.
  positions.push(
    x0, y, z0, x0, y, z1, x1, y, z1,
    x0, y, z0, x1, y, z1, x1, y, z0,
  );
}

function trianglesToGeometry(positions: readonly number[]): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function translatedBox(size: [number, number, number], position: [number, number, number]): BufferGeometry {
  const geometry = new BoxGeometry(...size);
  geometry.applyMatrix4(new Matrix4().makeTranslation(...position));
  return geometry;
}

export function landingPadGlowRegionCount(): number {
  return 5;
}

function frameBounds(): { outer: number; inner: number } {
  const outer = LANDING_PAD_DECK_SIZE / 2 - LANDING_PAD_FRAME_INSET;
  const inner = outer - LANDING_PAD_FRAME_WIDTH;
  return { outer, inner };
}

/** Inset square frame plus a small center square under the traveler. */
export function buildLandingPadPatternGeometry(
  topY: number = LANDING_PAD_DECK_TOP_Y + LANDING_PAD_PATTERN_LIFT,
): BufferGeometry {
  const glowPositions: number[] = [];
  const { outer, inner } = frameBounds();
  const centerHalf = LANDING_PAD_CENTER_SIZE / 2;

  pushQuad(glowPositions, -outer, inner, outer, outer, topY);
  pushQuad(glowPositions, -outer, -outer, outer, -inner, topY);
  pushQuad(glowPositions, inner, -inner, outer, inner, topY);
  pushQuad(glowPositions, -outer, -inner, -inner, inner, topY);
  pushQuad(glowPositions, -centerHalf, -centerHalf, centerHalf, centerHalf, topY);

  return trianglesToGeometry(glowPositions);
}

function appendStairRing(parts: BufferGeometry[], stepIndex: number): void {
  const deckHalf = LANDING_PAD_DECK_SIZE / 2;
  const innerHalf = deckHalf + LANDING_PAD_STAIR_RUN * stepIndex;
  const topY = LANDING_PAD_DECK_TOP_Y - stepIndex * LANDING_PAD_STEP_RISE;
  const centerY = topY - LANDING_PAD_STEP_RISE / 2;
  const sideLength = LANDING_PAD_DECK_SIZE + LANDING_PAD_STAIR_RUN * 2 * stepIndex;
  const edgeOffset = innerHalf + LANDING_PAD_STAIR_RUN / 2;
  const cornerOffset = innerHalf + LANDING_PAD_STAIR_RUN / 2;

  parts.push(translatedBox(
    [sideLength, LANDING_PAD_STEP_RISE, LANDING_PAD_STAIR_RUN],
    [0, centerY, edgeOffset],
  ));
  parts.push(translatedBox(
    [sideLength, LANDING_PAD_STEP_RISE, LANDING_PAD_STAIR_RUN],
    [0, centerY, -edgeOffset],
  ));
  parts.push(translatedBox(
    [LANDING_PAD_STAIR_RUN, LANDING_PAD_STEP_RISE, sideLength],
    [edgeOffset, centerY, 0],
  ));
  parts.push(translatedBox(
    [LANDING_PAD_STAIR_RUN, LANDING_PAD_STEP_RISE, sideLength],
    [-edgeOffset, centerY, 0],
  ));
  parts.push(translatedBox(
    [LANDING_PAD_STAIR_RUN, LANDING_PAD_STEP_RISE, LANDING_PAD_STAIR_RUN],
    [cornerOffset, centerY, cornerOffset],
  ));
  parts.push(translatedBox(
    [LANDING_PAD_STAIR_RUN, LANDING_PAD_STEP_RISE, LANDING_PAD_STAIR_RUN],
    [-cornerOffset, centerY, cornerOffset],
  ));
  parts.push(translatedBox(
    [LANDING_PAD_STAIR_RUN, LANDING_PAD_STEP_RISE, LANDING_PAD_STAIR_RUN],
    [cornerOffset, centerY, -cornerOffset],
  ));
  parts.push(translatedBox(
    [LANDING_PAD_STAIR_RUN, LANDING_PAD_STEP_RISE, LANDING_PAD_STAIR_RUN],
    [-cornerOffset, centerY, -cornerOffset],
  ));
}

export function buildLandingPadStructureGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [
    translatedBox(
      [LANDING_PAD_DECK_SIZE, LANDING_PAD_RISE, LANDING_PAD_DECK_SIZE],
      [0, LANDING_PAD_DECK_CENTER_Y, 0],
    ),
  ];

  for (let step = 0; step < LANDING_PAD_STAIR_STEPS; step += 1) {
    appendStairRing(parts, step);
  }

  const merged = mergeGeometries(parts, false);
  for (const part of parts) part.dispose();
  return merged ?? parts[0]!;
}
