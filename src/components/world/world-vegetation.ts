import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  DodecahedronGeometry,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DAY, NIGHT } from './world-materials';
import type { GridPoint } from './world-types';

export type VegetationKind = 'pine' | 'shrub';

export interface VegetationDefinition {
  kind: VegetationKind;
  position: GridPoint;
}

export interface VegetationBudget {
  drawCalls: number;
  triangles: number;
}

export interface VegetationPointer {
  x: number;
  y: number;
}

export const VEGETATION_DEFINITIONS: readonly VegetationDefinition[] = [
  { kind: 'pine', position: [-1.45, 0.25, 1.55] },
  { kind: 'shrub', position: [1.65, 0.25, -1.55] },
  { kind: 'shrub', position: [-1.25, 0.25, -1.75] },
  { kind: 'pine', position: [-8, -0.25, 0.85] },
  { kind: 'shrub', position: [-6.05, -0.25, -0.95] },
  { kind: 'pine', position: [1, 0.75, -7] },
  { kind: 'shrub', position: [-1, 0.75, -7] },
  { kind: 'shrub', position: [7, 0.75, 1.2] },
  { kind: 'shrub', position: [9, 0.75, 1.2] },
  { kind: 'pine', position: [-1, -0.25, 8] },
  { kind: 'shrub', position: [-1, -0.25, 6] },
  { kind: 'pine', position: [8, 1.25, 9.1] },
  { kind: 'shrub', position: [6, 1.25, 9] },
] as const;

const DIRT_TONE = 0;
const FOLIAGE_TONE = 1;
const MAX_SWAY = 0.03;

function addVegetationAttributes(
  geometry: BufferGeometry,
  tone: typeof DIRT_TONE | typeof FOLIAGE_TONE,
  phase: number,
  weightAtY: (y: number) => number,
): BufferGeometry {
  const position = geometry.getAttribute('position');
  const tones = new Float32Array(position.count);
  const phases = new Float32Array(position.count);
  const weights = new Float32Array(position.count);
  tones.fill(tone);
  phases.fill(phase);
  for (let index = 0; index < position.count; index += 1) {
    weights[index] = weightAtY(position.getY(index));
  }
  geometry.setAttribute('vegetationTone', new BufferAttribute(tones, 1));
  geometry.setAttribute('vegetationPhase', new BufferAttribute(phases, 1));
  geometry.setAttribute('vegetationSway', new BufferAttribute(weights, 1));
  geometry.setAttribute('color', new Float32BufferAttribute(position.count * 3, 3));
  return geometry;
}

function plantTransform(definition: VegetationDefinition, index: number): Matrix4 {
  const scaleStep = ((index * 7) % 5) - 2;
  const widthScale = 1 + scaleStep * 0.035;
  const heightScale = 1 + (((index * 3) % 5) - 2) * 0.025;
  return new Matrix4().compose(
    new Vector3(...definition.position),
    new Quaternion().setFromEuler(new Euler(0, index * 0.73 + 0.18, 0)),
    new Vector3(widthScale, heightScale, widthScale),
  );
}

function pineGeometries(definition: VegetationDefinition, index: number): BufferGeometry[] {
  const phase = index * 0.91 + 0.35;
  const transform = plantTransform(definition, index);
  const trunk = addVegetationAttributes(
    new BoxGeometry(0.16, 0.5, 0.16).translate(0, 0.25, 0).toNonIndexed(),
    DIRT_TONE,
    phase,
    (y) => Math.max(0, Math.min(0.22, y / 2.2)),
  );
  const lowerCrown = addVegetationAttributes(
    new ConeGeometry(0.48, 0.92, 5).translate(0, 0.82, 0).toNonIndexed(),
    FOLIAGE_TONE,
    phase,
    (y) => Math.max(0.18, Math.min(0.72, y / 1.7)),
  );
  const upperCrown = addVegetationAttributes(
    new ConeGeometry(0.34, 0.76, 5).translate(0, 1.35, 0).toNonIndexed(),
    FOLIAGE_TONE,
    phase,
    (y) => Math.max(0.48, Math.min(1, y / 1.65)),
  );
  return [trunk, lowerCrown, upperCrown].map((geometry) => geometry.applyMatrix4(transform));
}

function shrubGeometry(definition: VegetationDefinition, index: number): BufferGeometry {
  const phase = index * 0.91 + 0.35;
  const geometry = new DodecahedronGeometry(0.39, 0);
  geometry.scale(1.08, 0.72, 0.92);
  geometry.translate(0, 0.28, 0);
  addVegetationAttributes(
    geometry,
    FOLIAGE_TONE,
    phase,
    (y) => Math.max(0.12, Math.min(0.7, (y + 0.12) / 0.75)),
  );
  return geometry.applyMatrix4(plantTransform(definition, index));
}

export function applyVegetationTheme(geometry: BufferGeometry, nightMix: number): void {
  const tone = geometry.getAttribute('vegetationTone');
  const color = geometry.getAttribute('color');
  const dirt = new Color(DAY.dirt).lerp(new Color(NIGHT.dirt), nightMix);
  const foliage = new Color(DAY.olive).lerp(new Color(NIGHT.olive), nightMix);
  for (let index = 0; index < color.count; index += 1) {
    const source = tone.getX(index) === DIRT_TONE ? dirt : foliage;
    color.setXYZ(index, source.r, source.g, source.b);
  }
  color.needsUpdate = true;
}

export function buildVegetationGeometry(
  definitions: readonly VegetationDefinition[] = VEGETATION_DEFINITIONS,
): BufferGeometry {
  const pieces = definitions.flatMap((definition, index) => (
    definition.kind === 'pine'
      ? pineGeometries(definition, index)
      : [shrubGeometry(definition, index)]
  ));
  const geometry = mergeGeometries(pieces, false);
  pieces.forEach((piece) => piece.dispose());
  if (!geometry) throw new Error('Vegetation geometry could not be merged.');
  geometry.setAttribute(
    'vegetationBasePosition',
    new Float32BufferAttribute(Float32Array.from(geometry.getAttribute('position').array), 3),
  );
  applyVegetationTheme(geometry, 0);
  geometry.computeBoundingSphere();
  return geometry;
}

export function vegetationSwayOffset(
  elapsedTime: number,
  pointer: VegetationPointer,
  phase: number,
  reducedMotion: boolean,
): { x: number; z: number } {
  if (reducedMotion) return { x: 0, z: 0 };
  let x = Math.sin(elapsedTime * 1.13 + phase) * 0.018 - pointer.y * 0.006;
  let z = Math.cos(elapsedTime * 0.83 + phase * 1.27) * 0.011 - pointer.x * 0.006;
  const length = Math.hypot(x, z);
  if (length > MAX_SWAY) {
    const scale = MAX_SWAY / length;
    x *= scale;
    z *= scale;
  }
  return { x, z };
}

export function deformVegetationGeometry(
  geometry: BufferGeometry,
  elapsedTime: number,
  pointer: VegetationPointer,
  reducedMotion: boolean,
): void {
  const position = geometry.getAttribute('position');
  const base = geometry.getAttribute('vegetationBasePosition');
  const phase = geometry.getAttribute('vegetationPhase');
  const sway = geometry.getAttribute('vegetationSway');
  for (let index = 0; index < position.count; index += 1) {
    const offset = vegetationSwayOffset(elapsedTime, pointer, phase.getX(index), reducedMotion);
    const weight = sway.getX(index);
    position.setXYZ(
      index,
      base.getX(index) + offset.x * weight,
      base.getY(index),
      base.getZ(index) + offset.z * weight,
    );
  }
  position.needsUpdate = true;
}

export function estimateVegetationBudget(
  definitions: readonly VegetationDefinition[] = VEGETATION_DEFINITIONS,
): VegetationBudget {
  if (definitions.length === 0) return { drawCalls: 0, triangles: 0 };
  const geometry = buildVegetationGeometry(definitions);
  const triangles = geometry.index
    ? geometry.index.count / 3
    : geometry.getAttribute('position').count / 3;
  geometry.dispose();
  return { drawCalls: 1, triangles };
}
