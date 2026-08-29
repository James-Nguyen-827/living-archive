import { Box3, Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { OBB } from 'three/examples/jsm/math/OBB.js';
import { describe, expect, it } from 'vitest';
import { towerDesign, type TonedPart } from './tower-designs';
import { projectCourtPose } from './world-motion';

function transform(
  position: readonly [number, number, number],
  yaw = 0,
  scale: readonly [number, number, number] = [1, 1, 1],
): Matrix4 {
  return new Matrix4().compose(
    new Vector3(...position),
    new Quaternion().setFromEuler(new Euler(0, yaw, 0)),
    new Vector3(...scale),
  );
}

function partObb(part: TonedPart, parent = new Matrix4()): OBB {
  const local = new Matrix4().compose(
    new Vector3(...part.position),
    new Quaternion().setFromEuler(new Euler(...(part.rotation ?? [0, 0, 0]))),
    new Vector3(1, 1, 1),
  );
  const halfSize = new Vector3(...part.size).multiplyScalar(0.5);
  return new OBB().fromBox3(
    new Box3(halfSize.clone().multiplyScalar(-1), halfSize),
  ).applyMatrix4(parent.clone().multiply(local));
}

function obbAxisAlignedBounds(box: OBB): Box3 {
  const bounds = new Box3();
  const corner = new Vector3();
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        corner.set(
          box.halfSize.x * sx,
          box.halfSize.y * sy,
          box.halfSize.z * sz,
        );
        corner.applyMatrix3(box.rotation).add(box.center);
        bounds.expandByPoint(corner);
      }
    }
  }
  return bounds;
}

describe('Project Court gantry clearance', () => {
  it('stays inside its envelope and clear of the tower throughout arrival and exit', () => {
    const design = towerDesign('project-court', 2.5);
    const rear = design.assemblies['rear-slab']!;
    const front = design.assemblies['front-slab']!;
    const gantry = design.assemblies['coral-gantry']!;
    const staticObstacles = design.staticParts.slice(0, -1).map((part) => partObb(part));
    const progressSamples = [
      ...Array.from({ length: 101 }, (_unused, index) => index / 100),
      ...Array.from({ length: 101 }, (_unused, index) => 1 - index / 100),
    ];

    progressSamples.forEach((progress, sampleIndex) => {
      const pose = projectCourtPose(progress);
      const rearTransform = transform(
        [rear.position[0], rear.position[1] + pose.rearSlabLift, rear.position[2]],
        pose.rearSlabYaw,
      );
      const frontTransform = transform(
        [front.position[0], front.position[1] + pose.frontSlabLift, front.position[2]],
        pose.frontSlabYaw,
      );
      const gantryTransform = transform(
        pose.gantryPosition,
        pose.gantryYaw,
        [1, 1, pose.gantryScaleZ],
      );
      const obstacles = [
        ...staticObstacles,
        ...rear.parts.slice(0, -1).map((part) => partObb(part, rearTransform)),
        ...front.parts.slice(0, -1).map((part) => partObb(part, frontTransform)),
      ];

      gantry.parts.forEach((part, partIndex) => {
        const box = partObb(part, gantryTransform);
        const bounds = obbAxisAlignedBounds(box);

        expect(box.center.y + box.halfSize.y, `vertical envelope at sample ${sampleIndex}`).toBeLessThanOrEqual(2.85);
        expect(bounds.min.x, `west envelope at sample ${sampleIndex}`).toBeGreaterThanOrEqual(-0.93);
        expect(bounds.max.x, `east envelope at sample ${sampleIndex}`).toBeLessThanOrEqual(0.93);
        expect(bounds.min.z, `north envelope at sample ${sampleIndex}`).toBeGreaterThanOrEqual(-0.93);
        expect(bounds.max.z, `south envelope at sample ${sampleIndex}`).toBeLessThanOrEqual(0.93);
        obstacles.forEach((obstacle, obstacleIndex) => {
          expect(
            box.intersectsOBB(obstacle),
            `collision at progress ${progress.toFixed(2)}, gantry part ${partIndex}, obstacle ${obstacleIndex}`,
          ).toBe(false);
        });
      });
    });
  });
});
