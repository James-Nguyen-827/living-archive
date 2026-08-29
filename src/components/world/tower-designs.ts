import {
  Box3,
  BoxGeometry,
  BufferGeometry,
  Euler,
  Matrix4,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { PaletteKey } from './world-materials';

export type TowerArchetype = 'project-court' | 'index-engine' | 'paradox-gate' | 'orrery';
export type CompassFace = 'north' | 'east' | 'south' | 'west';

export type TonedPart<Tone extends string = PaletteKey> = {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
  tone: Tone;
};

export type WindowPart = Omit<TonedPart<'window'>, 'tone'> & {
  face: CompassFace;
};

export interface TowerAssembly {
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  instanceGroup?: string;
  parts: readonly TonedPart[];
}

export interface TowerDesign {
  staticParts: readonly TonedPart[];
  windows: readonly WindowPart[];
  assemblies: Readonly<Record<string, TowerAssembly>>;
  extentParts: readonly TonedPart[];
}

export function towerArchetypeFromModuleId(moduleId: string): TowerArchetype {
  switch (moduleId) {
    case 'work-tower': return 'project-court';
    case 'notes-tower': return 'index-engine';
    case 'experiments-tower': return 'paradox-gate';
    default: return 'orrery';
  }
}

function partGeometry(part: Pick<TonedPart, 'position' | 'size' | 'rotation'>): BoxGeometry {
  const geometry = new BoxGeometry(...part.size);
  const matrix = new Matrix4().makeRotationFromEuler(new Euler(...(part.rotation ?? [0, 0, 0])));
  matrix.setPosition(...part.position);
  geometry.applyMatrix4(matrix);
  return geometry;
}

export function buildRuinMeshes<Tone extends string>(parts: readonly TonedPart<Tone>[]) {
  const byTone = new Map<Tone, BufferGeometry[]>();
  parts.forEach((part) => {
    const geometry = partGeometry(part);
    const list = byTone.get(part.tone) ?? [];
    list.push(geometry);
    byTone.set(part.tone, list);
  });
  return [...byTone.entries()].map(([tone, geometries]) => ({
    tone,
    geometry: mergeGeometries(geometries) ?? geometries[0]!,
  }));
}

export function mergedWindowParts(parts: readonly WindowPart[]): BufferGeometry {
  const geometries = parts.map(partGeometry);
  return mergeGeometries(geometries) ?? geometries[0]!;
}

function windowPart(
  face: CompassFace,
  position: [number, number, number],
): WindowPart {
  const sideFace = face === 'east' || face === 'west';
  return {
    face,
    position,
    size: [0.14, 0.2, 0.02],
    rotation: sideFace ? [0, Math.PI / 2, 0] : undefined,
  };
}

function fourFaceWindows(
  width: number,
  depth: number,
  yValues: readonly number[],
  offsetX = 0,
  offsetZ = 0,
): readonly WindowPart[] {
  return yValues.flatMap((y) => [
    windowPart('north', [offsetX, y, offsetZ + depth / 2 + 0.012]),
    windowPart('east', [offsetX + width / 2 + 0.012, y, offsetZ]),
    windowPart('south', [offsetX, y, offsetZ - depth / 2 - 0.012]),
    windowPart('west', [offsetX - width / 2 - 0.012, y, offsetZ]),
  ]);
}

function translatedAssemblyParts(assembly: TowerAssembly): readonly TonedPart[] {
  const scale = assembly.scale ?? [1, 1, 1];
  const rotation = assembly.rotation ?? [0, 0, 0];
  const assemblyRotation = new Euler(...rotation);
  return assembly.parts.map((part) => ({
    ...part,
    position: new Vector3(
      part.position[0] * scale[0],
      part.position[1] * scale[1],
      part.position[2] * scale[2],
    ).applyEuler(assemblyRotation).add(new Vector3(...assembly.position)).toArray() as [number, number, number],
    size: [part.size[0] * scale[0], part.size[1] * scale[1], part.size[2] * scale[2]],
    rotation: [
      (part.rotation?.[0] ?? 0) + rotation[0],
      (part.rotation?.[1] ?? 0) + rotation[1],
      (part.rotation?.[2] ?? 0) + rotation[2],
    ],
  }));
}

function projectCourtDesign(_height: number): TowerDesign {
  const staticParts: readonly TonedPart[] = [
    { position: [0, 0.1, 0], size: [1.62, 0.2, 1.54], tone: 'structure' },
    { position: [-0.54, 1.02, -0.48], size: [0.36, 1.84, 0.4], tone: 'surface' },
    { position: [-0.22, 0.48, -0.48], size: [0.64, 0.56, 0.34], tone: 'surface' },
    { position: [-0.42, 1.98, -0.48], size: [0.64, 0.12, 0.5], tone: 'structure' },
    { position: [-0.3, 1.5, -0.48], size: [0.8, 0.12, 0.5], tone: 'structure' },
    { position: [0.5, 0.75, 0.46], size: [0.44, 1.3, 0.44], tone: 'surface' },
    { position: [0.5, 0.42, 0.12], size: [0.42, 0.64, 0.7], tone: 'surface' },
    { position: [0.26, 1.43, 0.3], size: [0.9, 0.12, 0.76], tone: 'structure' },
    { position: [0.5, 1.74, 0.46], size: [0.22, 0.56, 0.22], tone: 'structure' },
    { position: [-0.54, 2.08, -0.74], size: [0.3, 0.08, 0.28], tone: 'structure' },
  ];
  const assemblies: Readonly<Record<string, TowerAssembly>> = {
    'rear-slab': {
      position: [-0.54, 2.08, -0.48],
      parts: [
        { position: [0.51, 0, 0], size: [1.08, 0.16, 0.32], tone: 'structure' },
        { position: [0.25, -0.18, 0], size: [0.5, 0.24, 0.24], tone: 'surface' },
        { position: [0.08, 0.13, 0], size: [0.28, 0.1, 0.24], tone: 'structure' },
      ],
    },
    'front-slab': {
      position: [0.5, 2.08, 0.46],
      parts: [
        { position: [-0.49, 0, 0], size: [1.04, 0.16, 0.34], tone: 'structure' },
        { position: [-0.25, -0.18, 0], size: [0.52, 0.24, 0.26], tone: 'surface' },
        { position: [0, 0.13, 0.08], size: [0.28, 0.1, 0.24], tone: 'structure' },
      ],
    },
    'coral-gantry': {
      position: [-0.02, 2.32, -0.01],
      parts: [
        { position: [0, 0, 0], size: [0.18, 0.12, 1.29], tone: 'coral' },
        { position: [0, 0, -0.61], size: [0.28, 0.16, 0.16], tone: 'coral' },
        { position: [0, 0, 0.61], size: [0.28, 0.16, 0.16], tone: 'coral' },
      ],
    },
  };
  const extentParts: readonly TonedPart[] = [
    ...staticParts,
    ...Object.values(assemblies).flatMap(translatedAssemblyParts),
    { position: [0, 1.42, 0], size: [1.78, 2.84, 1.78], tone: 'surface' as const },
  ];
  return {
    staticParts,
    windows: [
      ...fourFaceWindows(0.36, 0.4, [0.88], -0.54, -0.48),
      ...fourFaceWindows(0.44, 0.44, [0.72], 0.5, 0.46),
    ],
    assemblies,
    extentParts,
  };
}

function indexEngineCPieceParts(): readonly TonedPart[] {
  return [
    { position: [-0.18, 0, 0], size: [0.12, 0.62, 0.2], tone: 'surface' },
    { position: [0.04, 0.26, 0], size: [0.44, 0.12, 0.2], tone: 'surface' },
    { position: [0.04, -0.26, 0], size: [0.44, 0.12, 0.2], tone: 'surface' },
  ];
}

function indexEngineDesign(height: number): TowerDesign {
  const staticParts: readonly TonedPart[] = [
    { position: [0, 0.1, 0], size: [1.5, 0.2, 1.2], tone: 'structure' },
    { position: [0.08, 0.26, 0], size: [1.16, 0.12, 0.92], tone: 'structure' },
    { position: [-0.32, height * 0.46, 0.13], size: [0.22, height * 0.86, 0.28], tone: 'surface' },
    { position: [0, height * 0.46, 0], size: [0.42, height * 0.82, 0.42], tone: 'surface' },
    { position: [0.38, height * 0.22, -0.28], size: [0.1, height * 0.38, 0.1], tone: 'structure' },
    { position: [0.38, height * 0.4, 0.1], size: [0.1, 0.1, 0.76], tone: 'structure' },
    { position: [0.19, height * 0.4, -0.28], size: [0.42, 0.1, 0.1], tone: 'structure' },
  ];
  const cPiece = indexEngineCPieceParts();
  const assemblies: Readonly<Record<string, TowerAssembly>> = {
    'chamber-0': { position: [0.38, 0.85, 0.15], scale: [1, 0.85, 1], instanceGroup: 'index-engine-pieces', parts: cPiece },
    'chamber-1': { position: [-0.3, 1.63, -0.16], scale: [0.92, 0.92, 0.92], rotation: [0, Math.PI / 2, 0], instanceGroup: 'index-engine-pieces', parts: cPiece },
    'chamber-2': { position: [0.28, 2.4, -0.15], scale: [1.05, 0.9, 1], rotation: [0, Math.PI, 0], instanceGroup: 'index-engine-pieces', parts: cPiece },
    'chamber-3': { position: [-0.35, 3.16, 0.14], scale: [0.94, 0.88, 0.94], rotation: [0, Math.PI * 1.5, 0], instanceGroup: 'index-engine-pieces', parts: cPiece },
    'crown-half-0': { position: [0.2, 4.0, 0.1], scale: [1.1, 0.9, 1], instanceGroup: 'index-engine-pieces', parts: cPiece },
    'crown-half-1': { position: [-0.2, 4.0, -0.1], scale: [1.1, 0.9, 1], rotation: [0, Math.PI, 0], instanceGroup: 'index-engine-pieces', parts: cPiece },
    'coral-carriage': {
      position: [0, 4.38, 0],
      parts: [
        { position: [0, 0, 0], size: [0.28, 0.2, 0.28], tone: 'coral' },
        { position: [0, -0.15, 0], size: [0.1, 0.16, 0.1], tone: 'coral' },
        { position: [0, -0.23, 0.1], size: [0.2, 0.06, 0.08], tone: 'coral' },
      ],
    },
  };
  const extentParts: readonly TonedPart[] = [
    ...staticParts,
    ...Object.values(assemblies).flatMap(translatedAssemblyParts),
    { position: [0, 2.44, 0], size: [1.8, 4.88, 1.8], tone: 'surface' as const },
  ];
  return {
    staticParts,
    windows: fourFaceWindows(0.42, 0.42, [0.72, 1.48, 2.24, 3, 3.76]),
    assemblies,
    extentParts,
  };
}

function frameParts(width: number, height: number, tone: PaletteKey): readonly TonedPart[] {
  const thickness = 0.14;
  const depth = 0.22;
  return [
    { position: [0, height / 2 - thickness / 2, 0], size: [width, thickness, depth], tone },
    { position: [0, -height / 2 + thickness / 2, 0], size: [width, thickness, depth], tone },
    { position: [-width / 2 + thickness / 2, 0, 0], size: [thickness, height, depth], tone },
    { position: [width / 2 - thickness / 2, 0, 0], size: [thickness, height, depth], tone },
  ];
}

function paradoxWindows(height: number): readonly WindowPart[] {
  return [height * 0.32, height * 0.5].flatMap((y) => [
    windowPart('north', [-0.64, y, 0.286]),
    windowPart('south', [-0.64, y, -0.286]),
    windowPart('east', [0.802, y, 0]),
    windowPart('west', [-0.802, y, 0]),
  ]);
}

function paradoxGateDesign(height: number): TowerDesign {
  const pierHeight = height * 0.72;
  const pierY = 0.18 + pierHeight / 2;
  const frameY = height * 0.58;
  const staticParts: readonly TonedPart[] = [
    { position: [0, 0.1, 0], size: [1.72, 0.2, 0.76], tone: 'structure' },
    { position: [-0.64, pierY, 0], size: [0.3, pierHeight, 0.55], tone: 'surface' },
    { position: [0.64, pierY, 0], size: [0.3, pierHeight, 0.55], tone: 'surface' },
    { position: [0, height * 0.79, 0], size: [1.6, 0.18, 0.55], tone: 'structure' },
    { position: [-0.64, height * 0.36, 0], size: [0.42, 0.1, 0.66], tone: 'structure' },
    { position: [0.64, height * 0.58, 0], size: [0.42, 0.1, 0.66], tone: 'structure' },
  ];
  const assemblies: Readonly<Record<string, TowerAssembly>> = {
    'frame-0': { position: [0, frameY, 0], scale: [1.12, 1.12, 1], instanceGroup: 'frames', parts: frameParts(1, 1, 'olive') },
    'frame-1': { position: [0, frameY, 0], scale: [0.84, 0.84, 1], instanceGroup: 'frames', parts: frameParts(1, 1, 'olive') },
    'frame-2': { position: [0, frameY, 0], scale: [0.58, 0.58, 1], instanceGroup: 'frames', parts: frameParts(1, 1, 'olive') },
    cube: {
      position: [0, height * 0.91, 0],
      parts: [{ position: [0, 0, 0], size: [0.26, 0.26, 0.26], tone: 'coral' }],
    },
  };
  const extentParts: readonly TonedPart[] = [
    ...staticParts,
    ...Object.values(assemblies).flatMap(translatedAssemblyParts),
    { position: [0, (height + 0.24) / 2, 0], size: [1.72, height + 0.24, 1.4], tone: 'surface' as const },
  ];
  return {
    staticParts,
    windows: paradoxWindows(height),
    assemblies,
    extentParts,
  };
}

function ellipseRingParts(radiusX: number, radiusZ: number, segments: number): readonly TonedPart[] {
  return Array.from({ length: segments }, (_unused, index): TonedPart => {
    const angle = index / segments * Math.PI * 2;
    return {
      position: [Math.cos(angle) * radiusX, 0, Math.sin(angle) * radiusZ],
      size: [0.22, 0.09, 0.09],
      rotation: [0, -angle, 0],
      tone: 'sun',
    };
  });
}

function orreryDesign(height: number): TowerDesign {
  const ringY = height * 0.9;
  const staticParts: readonly TonedPart[] = [
    { position: [0, 0.1, 0], size: [0.9, 0.2, 0.9], tone: 'structure' },
    { position: [0, height * 0.35, 0], size: [0.42, height * 0.66, 0.42], tone: 'surface' },
    { position: [0, height * 0.7, 0], size: [1.36, 0.12, 0.78], tone: 'structure' },
    { position: [0, height * 0.63, 0], size: [0.66, 0.12, 0.24], tone: 'structure' },
    { position: [0, height * 0.78, 0], size: [0.52, 0.42, 0.52], tone: 'surface' },
    { position: [0, ringY, 0], size: [0.22, 0.22, 0.22], tone: 'coral' },
  ];
  const assemblies: Readonly<Record<string, TowerAssembly>> = {
    'ring-0': { position: [0, ringY, 0], parts: ellipseRingParts(0.76, 0.61, 16) },
    'ring-1': { position: [0, ringY, 0], parts: ellipseRingParts(0.67, 0.52, 14) },
    'ring-2': { position: [0, ringY, 0], parts: ellipseRingParts(0.5, 0.39, 12) },
  };
  const extentParts: readonly TonedPart[] = [
    ...staticParts,
    ...Object.values(assemblies).flatMap(translatedAssemblyParts),
    { position: [0, (height + 0.52) / 2, 0], size: [1.7, height + 0.52, 1.5], tone: 'surface' as const },
  ];
  return {
    staticParts,
    windows: fourFaceWindows(0.42, 0.42, [0.72, 1.32, 1.92]),
    assemblies,
    extentParts,
  };
}

export function towerDesign(archetype: TowerArchetype, height: number): TowerDesign {
  switch (archetype) {
    case 'project-court': return projectCourtDesign(height);
    case 'index-engine': return indexEngineDesign(height);
    case 'paradox-gate': return paradoxGateDesign(height);
    case 'orrery': return orreryDesign(height);
  }
}

export function estimateTowerDesignBudget(
  archetype: TowerArchetype,
  height: number,
): { drawCalls: number; triangles: number } {
  const design = towerDesign(archetype, height);
  const toneCount = (parts: readonly TonedPart[]) => new Set(parts.map((part) => part.tone)).size;
  const assemblyEntries = Object.entries(design.assemblies);
  const assemblies = assemblyEntries.map(([, assembly]) => assembly);
  const assemblyGroups = new Map<string, Set<PaletteKey>>();
  assemblyEntries.forEach(([key, assembly]) => {
    const tones = assemblyGroups.get(assembly.instanceGroup ?? key) ?? new Set<PaletteKey>();
    assembly.parts.forEach((part) => tones.add(part.tone));
    assemblyGroups.set(assembly.instanceGroup ?? key, tones);
  });
  const authoredBoxCount = design.staticParts.length
    + design.windows.length
    + assemblies.reduce((count, assembly) => count + assembly.parts.length, 0);
  return {
    drawCalls: toneCount(design.staticParts)
      + [...assemblyGroups.values()].reduce((count, tones) => count + tones.size, 0)
      + 1
      + (archetype === 'orrery' ? 1 : 0),
    triangles: authoredBoxCount * 12 + (archetype === 'orrery' ? 24 : 0),
  };
}

export function towerDesignEnvelope(design: TowerDesign): { width: number; height: number; depth: number } {
  const bounds = designBounds(design);
  const size = bounds.getSize(new Vector3());
  return { width: size.x, height: size.y, depth: size.z };
}

function designBounds(design: TowerDesign): Box3 {
  const bounds = new Box3();
  design.extentParts.forEach((part) => {
    const geometry = partGeometry(part);
    geometry.computeBoundingBox();
    if (geometry.boundingBox) bounds.union(geometry.boundingBox);
    geometry.dispose();
  });
  return bounds;
}

export function towerDesignTopY(design: TowerDesign): number {
  return designBounds(design).max.y;
}
