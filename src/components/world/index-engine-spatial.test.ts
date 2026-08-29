import { Box3, Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { OBB } from 'three/examples/jsm/math/OBB.js';
import { describe, expect, it } from 'vitest';
import { LABEL_CLEARANCE, zoneLabelAnchor } from './label-anchors';
import { DECOR_GROUND_SNAP } from './world-materials';
import { towerDesign, type TonedPart, type TowerAssembly } from './tower-designs';
import {
  indexEngineCarriagePose,
  indexEngineChamberPose,
  indexEngineCrownHalfPose,
} from './world-motion';
import { WORLD_MAP } from './world-map';

const CHAMBER_KEYS = ['chamber-0', 'chamber-1', 'chamber-2', 'chamber-3'] as const;
const CROWN_KEYS = ['crown-half-0', 'crown-half-1'] as const;

/** Named socket contacts that are intentional before the crown splits at 0.78. */
const CROWN_SOCKET_CONTACT = {
  first: 'crown-half-0',
  second: 'crown-half-1',
  progressEnd: 0.78,
} as const;

/** Carriage departs from the seated coral cap at the neutral crown. */
const CARRIAGE_CROWN_DEPARTURE = {
  carriage: 'coral-carriage',
  crowns: CROWN_KEYS,
  progressEnd: 0.06,
} as const;

function collisionKey(firstKey: string, firstPart: number, secondKey: string, secondPart: number): string {
  return `${firstKey}:${firstPart} hits ${secondKey}:${secondPart}`;
}

function isAllowedCollision(
  firstKey: string,
  secondKey: string,
  progress: number,
): boolean {
  const pair = [firstKey, secondKey].sort().join('|');
  if (
    pair === [CROWN_SOCKET_CONTACT.first, CROWN_SOCKET_CONTACT.second].sort().join('|')
    && progress <= CROWN_SOCKET_CONTACT.progressEnd
  ) {
    return true;
  }
  if (
    progress <= CARRIAGE_CROWN_DEPARTURE.progressEnd
    && (
      (firstKey === CARRIAGE_CROWN_DEPARTURE.carriage && CARRIAGE_CROWN_DEPARTURE.crowns.includes(secondKey as typeof CROWN_KEYS[number]))
      || (secondKey === CARRIAGE_CROWN_DEPARTURE.carriage && CARRIAGE_CROWN_DEPARTURE.crowns.includes(firstKey as typeof CROWN_KEYS[number]))
    )
  ) {
    return true;
  }
  return false;
}

function transform(
  position: readonly [number, number, number],
  rotation: readonly [number, number, number],
  scale: readonly [number, number, number] = [1, 1, 1],
): Matrix4 {
  return new Matrix4().compose(
    new Vector3(...position),
    new Quaternion().setFromEuler(new Euler(...rotation)),
    new Vector3(...scale),
  );
}

function partObb(part: TonedPart, parent = new Matrix4()): OBB {
  const local = transform(part.position, part.rotation ?? [0, 0, 0]);
  const halfSize = new Vector3(...part.size).multiplyScalar(0.5);
  return new OBB().fromBox3(
    new Box3(halfSize.clone().multiplyScalar(-1), halfSize),
  ).applyMatrix4(parent.clone().multiply(local));
}

function bounds(box: OBB): Box3 {
  const result = new Box3();
  const corner = new Vector3();
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        corner.set(box.halfSize.x * sx, box.halfSize.y * sy, box.halfSize.z * sz);
        corner.applyMatrix3(box.rotation).add(box.center);
        result.expandByPoint(corner);
      }
    }
  }
  return result;
}

function assemblyBoxes(assembly: TowerAssembly, parent: Matrix4): OBB[] {
  return assembly.parts.map((part) => partObb(part, parent));
}

describe('Index Engine spatial safety', () => {
  it('keeps every sampled arrival and exit pose finite, bounded, label-clear, and collision-free', () => {
    const design = towerDesign('index-engine', 4.5);
    const tower = WORLD_MAP.modules.find((module) => module.id === 'notes-tower')!;
    const labelLocalY = zoneLabelAnchor('field-notes')[1]
      - tower.transform.position[1]
      + DECOR_GROUND_SNAP;
    const rackAndRail = design.staticParts.slice(4).map((part) => partObb(part));
    const samples = [
      ...Array.from({ length: 101 }, (_unused, index) => index / 100),
      ...Array.from({ length: 101 }, (_unused, index) => 1 - index / 100),
    ];
    const collisions = new Map<string, [number, number]>();
    const recordCollision = (key: string, progress: number) => {
      const range = collisions.get(key) ?? [progress, progress];
      range[0] = Math.min(range[0], progress);
      range[1] = Math.max(range[1], progress);
      collisions.set(key, range);
    };

    samples.forEach((progress, sampleIndex) => {
      const moving = [
        ...CHAMBER_KEYS.map((key, index) => {
          const assembly = design.assemblies[key]!;
          const pose = indexEngineChamberPose(progress, index);
          return { key, boxes: assemblyBoxes(assembly, transform(pose.position, pose.rotation, assembly.scale)) };
        }),
        ...CROWN_KEYS.map((key, index) => {
          const assembly = design.assemblies[key]!;
          const pose = indexEngineCrownHalfPose(progress, index);
          return { key, boxes: assemblyBoxes(assembly, transform(pose.position, pose.rotation, assembly.scale)) };
        }),
        (() => {
          const key = 'coral-carriage';
          const assembly = design.assemblies[key]!;
          const pose = indexEngineCarriagePose(progress);
          return { key, boxes: assemblyBoxes(assembly, transform(pose.position, pose.rotation)) };
        })(),
      ];

      moving.forEach(({ key, boxes: movingBoxes }) => {
        movingBoxes.forEach((box, partIndex) => {
          const boxBounds = bounds(box);
          const values = [
            ...box.center.toArray(),
            ...box.halfSize.toArray(),
            ...box.rotation.elements,
          ];
          expect(values.every(Number.isFinite), `${key} finite at sample ${sampleIndex}`).toBe(true);
          expect(boxBounds.min.x, `${key} west bound at sample ${sampleIndex}`).toBeGreaterThanOrEqual(-0.9);
          expect(boxBounds.max.x, `${key} east bound at sample ${sampleIndex}`).toBeLessThanOrEqual(0.9);
          expect(boxBounds.min.z, `${key} north bound at sample ${sampleIndex}`).toBeGreaterThanOrEqual(-0.9);
          expect(boxBounds.max.z, `${key} south bound at sample ${sampleIndex}`).toBeLessThanOrEqual(0.9);
          expect(
            boxBounds.max.y,
            `${key} label clearance at sample ${sampleIndex}`,
          ).toBeLessThanOrEqual(labelLocalY - LABEL_CLEARANCE);

          rackAndRail.forEach((obstacle, obstacleIndex) => {
            if (box.intersectsOBB(obstacle)) {
              recordCollision(`${key} part ${partIndex} hits rack/rail ${obstacleIndex}`, progress);
            }
          });
        });
      });

      moving.forEach((first, firstIndex) => {
        moving.slice(firstIndex + 1).forEach((second) => {
          first.boxes.forEach((firstBox, firstPart) => {
            second.boxes.forEach((secondBox, secondPart) => {
              if (firstBox.intersectsOBB(secondBox)) {
                if (isAllowedCollision(first.key, second.key, progress)) return;
                recordCollision(collisionKey(first.key, firstPart, second.key, secondPart), progress);
              }
            });
          });
        });
      });
    });

    expect([...collisions].map(([key, range]) => `${key} from ${range[0].toFixed(2)} to ${range[1].toFixed(2)}`)).toEqual([]);
  });
});
