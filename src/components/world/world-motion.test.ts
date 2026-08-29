import { describe, expect, it } from 'vitest';
import {
  angleFromDrag,
  cameraReframeProgress,
  degreesForAngle,
  easeInOutCubic,
  easeOutQuint,
  nearestEquivalentAngle,
  nudgeAngle,
  carouselBulbGlow,
  carouselLightOpacity,
  carouselSpinSpeed,
  CAROUSEL_IDLE_SPIN_SPEED,
  coralBeaconGlow,
  advanceTowerReaction,
  INDEX_ENGINE_REACTION_DURATIONS,
  indexEngineAmbientCarriageOffset,
  indexEngineCarriagePose,
  indexEngineChamberAmbientPose,
  indexEngineChamberPose,
  indexEngineCrownHalfPose,
  gateBlockPose,
  lanternRingSpin,
  orreryBeamPose,
  orreryBeamSweep,
  orreryBeaconGlow,
  orreryRingPose,
  pageRiffleYaw,
  paradoxCubePose,
  paradoxFrameIdleSpin,
  paradoxFramePose,
  projectCourtAmbientPose,
  projectCourtPose,
  rotatePointY,
  signalBarProgress,
  themeTransitionProgress,
  towerWindowGlow,
  travelerStepDuration,
} from './world-motion';

describe('world rotation motion', () => {
  it('uses a bounded ease-out-quint curve', () => {
    expect(easeOutQuint(-1)).toBe(0);
    expect(easeOutQuint(0)).toBe(0);
    expect(easeOutQuint(0.5)).toBeCloseTo(0.96875);
    expect(easeOutQuint(1)).toBe(1);
    expect(easeOutQuint(2)).toBe(1);
  });

  it('eases camera reframes gently over nine hundred milliseconds', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
    expect(easeInOutCubic(1)).toBe(1);
    expect(cameraReframeProgress(0)).toBe(0);
    expect(cameraReframeProgress(0.45)).toBeCloseTo(0.5);
    expect(cameraReframeProgress(0.9)).toBe(1);
  });

  it('chooses the shortest equivalent quarter-turn across the angle seam', () => {
    expect(nearestEquivalentAngle(0, -Math.PI * 1.5)).toBeCloseTo(Math.PI / 2);
    expect(nearestEquivalentAngle(-Math.PI * 1.5, 0)).toBeCloseTo(-Math.PI * 2);
  });

  it('rotates focus points into the visible world coordinate space', () => {
    expect(rotatePointY([-7, 0, 0], -Math.PI / 2)).toEqual([0, 0, -7]);
    expect(rotatePointY([0, 0.5, -8], -Math.PI)).toEqual([0, 0.5, 8]);
  });

  it('tracks an arbitrary drag angle without snapping to a quarter turn', () => {
    expect(angleFromDrag(0, 220, 100)).toBeCloseTo(0.96);
    expect(angleFromDrag(0.2, 100, 137)).toBeCloseTo(-0.096);
  });

  it('nudges rotation by one eighth-turn and formats a stable degree readout', () => {
    expect(nudgeAngle(0, 1)).toBeCloseTo(Math.PI / 8);
    expect(nudgeAngle(0, -1)).toBeCloseTo(-Math.PI / 8);
    expect(degreesForAngle(-Math.PI / 2)).toBe(270);
    expect(degreesForAngle(Math.PI * 2)).toBe(0);
  });

  it('keeps complete guided journeys between 0.9 and 1.5 seconds', () => {
    expect(travelerStepDuration(2)).toBe(180);
    expect(travelerStepDuration(14)).toBe(100);
  });

  it('clamps the miniature dusk timeline at its final state', () => {
    expect(themeTransitionProgress(-0.1)).toBe(0);
    expect(themeTransitionProgress(0.45)).toBeCloseTo(0.96875);
    expect(themeTransitionProgress(0.9)).toBe(1);
    expect(themeTransitionProgress(2)).toBe(1);
  });

  it('snaps environmental reactions to final poses under reduced motion', () => {
    expect(signalBarProgress(0, true, true)).toBe(1);
    expect(signalBarProgress(0, false, true)).toBe(0);
    expect(signalBarProgress(0.16, true, false)).toBeCloseTo(easeOutQuint(0.5));
  });

  it('keeps carousel bulbs dark by day until the hobbies zone is visited', () => {
    expect(carouselLightOpacity(0, false, false, false)).toBe(0);
    expect(carouselLightOpacity(1.2, false, false, true)).toBe(0);
  });

  it('lights carousel bulbs all night whether or not the zone was visited', () => {
    expect(carouselLightOpacity(0, true, false, false)).toBe(0.6);
    expect(carouselLightOpacity(1.2, true, false, true)).toBe(0.6);
    for (const elapsed of [0, 0.25, 0.5, 1.4]) {
      const opacity = carouselLightOpacity(elapsed, true, true, false);
      expect(opacity).toBeGreaterThan(carouselLightOpacity(elapsed, true, false, false));
      expect(opacity).toBeLessThanOrEqual(1);
    }
  });

  it('holds carousel bulbs lit under reduced motion and pulses them otherwise', () => {
    expect(carouselLightOpacity(0, false, true, true)).toBe(0.85);
    expect(carouselLightOpacity(0, true, true, true)).toBe(0.95);
    for (const elapsed of [0, 0.25, 0.5, 1.4]) {
      const opacity = carouselLightOpacity(elapsed, false, true, false);
      expect(opacity).toBeGreaterThanOrEqual(0.1);
      expect(opacity).toBeLessThanOrEqual(0.8);
    }
    expect(carouselLightOpacity(0, false, true, false)).not.toBe(carouselLightOpacity(0.4, false, true, false));
  });

  it('breathes carousel bulbs in and out while lit with the orrery ring cadence', () => {
    expect(carouselBulbGlow(0, false, false, false)).toBe(0);
    expect(carouselBulbGlow(0, true, false, true)).toBe(0.6);
    expect(carouselBulbGlow(0, true, false, false)).not.toBe(carouselBulbGlow(0.4, true, false, false));
    for (const elapsed of [0, 0.35, 0.7, 1.1]) {
      const glow = carouselBulbGlow(elapsed, true, false, false);
      expect(glow).toBeGreaterThanOrEqual(0.26);
      expect(glow).toBeLessThanOrEqual(0.6);
    }
  });

  it('gives the carousel a visit burst that settles back to the idle spin', () => {
    expect(carouselSpinSpeed(0, false, false)).toBe(CAROUSEL_IDLE_SPIN_SPEED);
    expect(carouselSpinSpeed(0, true, true)).toBe(0);
    expect(carouselSpinSpeed(0, true, false)).toBe(CAROUSEL_IDLE_SPIN_SPEED);
    const peak = carouselSpinSpeed(0.6, true, false);
    expect(peak).toBeCloseTo(CAROUSEL_IDLE_SPIN_SPEED * 5);
    for (const elapsed of [0.1, 0.6, 1, 2]) {
      expect(carouselSpinSpeed(elapsed, true, false)).toBeGreaterThan(CAROUSEL_IDLE_SPIN_SPEED);
      expect(carouselSpinSpeed(elapsed, true, false)).toBeLessThanOrEqual(peak);
    }
    expect(carouselSpinSpeed(6, true, false)).toBeCloseTo(CAROUSEL_IDLE_SPIN_SPEED, 2);
  });

  it('lights tower windows at night and leaves them faint in daylight', () => {
    expect(towerWindowGlow(0, true, false, false)).toBe(0.8);
    expect(towerWindowGlow(0, false, false, false)).toBe(0.16);
    expect(towerWindowGlow(0, true, false, false)).toBeGreaterThan(towerWindowGlow(0, false, false, false));
  });

  it('lifts tower windows for the active zone without exceeding full opacity', () => {
    expect(towerWindowGlow(0, true, true, true)).toBe(0.94);
    expect(towerWindowGlow(0, false, true, true)).toBe(0.62);
    for (const night of [true, false]) {
      for (const elapsed of [0, 0.28, 0.56, 1.4]) {
        const opacity = towerWindowGlow(elapsed, night, true, false);
        expect(opacity).toBeGreaterThan(towerWindowGlow(elapsed, night, false, false));
        expect(opacity).toBeLessThanOrEqual(1);
      }
    }
    expect(towerWindowGlow(0, true, true, false)).not.toBe(towerWindowGlow(0.4, true, true, false));
  });

  it('glows orrery rings and hub at night only', () => {
    expect(orreryBeaconGlow(0, false, false, false)).toBe(0);
    expect(orreryBeaconGlow(0, true, false, false)).toBe(0.88);
    expect(orreryBeaconGlow(0, true, true, true)).toBe(1);
    expect(orreryBeaconGlow(0, true, true, false)).toBeGreaterThan(orreryBeaconGlow(0, true, false, false));
  });

  it('glows coral sculptures at night only with a gentle idle pulse', () => {
    expect(coralBeaconGlow(0, false, false)).toBe(0);
    expect(coralBeaconGlow(0, true, true)).toBe(0.9);
    expect(coralBeaconGlow(0, true, false)).not.toBe(coralBeaconGlow(0.4, true, false));
    for (const elapsed of [0, 0.35, 0.7, 1.1]) {
      const glow = coralBeaconGlow(elapsed, true, false);
      expect(glow).toBeGreaterThanOrEqual(0.85);
      expect(glow).toBeLessThanOrEqual(0.95);
    }
  });

  it('flickers the orrery beacon subtly when About is active at night', () => {
    expect(orreryBeaconGlow(0, true, true, false)).not.toBe(orreryBeaconGlow(0.4, true, true, false));
    for (const elapsed of [0, 0.35, 0.7, 1.1]) {
      const opacity = orreryBeaconGlow(elapsed, true, true, false);
      expect(opacity).toBeGreaterThanOrEqual(0.95);
      expect(opacity).toBeLessThanOrEqual(1.05);
    }
  });

  it('riffles archive slabs with staggered visit motion', () => {
    expect(pageRiffleYaw(0, 0, false, false)).toBe(0);
    expect(pageRiffleYaw(0, 1, false, false)).toBeGreaterThan(0);
    expect(pageRiffleYaw(0, 2, true, true)).toBeGreaterThan(pageRiffleYaw(0, 2, false, true));
    expect(pageRiffleYaw(0.62, 3, true, false)).not.toBe(pageRiffleYaw(0, 3, true, false));
  });

  it('slots the experiments gate cube through the lintel on visit', () => {
    const floatY = 1.2;
    const slotY = 1.55;
    expect(gateBlockPose(0, false, false, floatY, slotY).y).toBeCloseTo(floatY);
    expect(gateBlockPose(0, true, true, floatY, slotY).rotationY).toBeCloseTo(Math.PI / 2);
    const mid = gateBlockPose(0.45, true, false, floatY, slotY);
    expect(mid.y).toBeGreaterThan(floatY);
    expect(mid.y).toBeLessThanOrEqual(slotY);
    expect(gateBlockPose(0.62, true, false, floatY, slotY).y).toBeCloseTo(floatY, 1);
  });

  it('counter-rotates lighthouse rings faster on visit', () => {
    const idle = lanternRingSpin(2, false, false);
    const active = lanternRingSpin(2, true, false);
    expect(idle.inner).toBeGreaterThan(0);
    expect(idle.outer).toBeLessThan(0);
    expect(Math.abs(active.inner)).toBeGreaterThan(Math.abs(idle.inner));
    expect(lanternRingSpin(0, true, true)).toEqual({ inner: 0.45, outer: -0.32 });
  });
});

describe('narrative tower reactions', () => {
  it('advances arrivals over 1.05 seconds and exits over 0.65 seconds', () => {
    const arriving = advanceTowerReaction({ progress: 0, sequence: 4 }, 0.525, true, 4, false);
    const exiting = advanceTowerReaction({ progress: 1, sequence: 4 }, 0.325, false, 4, false);

    expect(arriving.progress).toBeCloseTo(0.5);
    expect(exiting.progress).toBeCloseTo(0.5);
  });

  it('supports a longer reversible ceremony without changing the shared timing', () => {
    const durations = { arrival: 1.4, exit: 0.8 };
    const arriving = advanceTowerReaction(
      { progress: 0, sequence: 4 },
      0.7,
      true,
      4,
      false,
      durations,
    );
    const exiting = advanceTowerReaction(
      { progress: 1, sequence: 4 },
      0.4,
      false,
      4,
      false,
      durations,
    );

    expect(arriving.progress).toBeCloseTo(0.5);
    expect(exiting.progress).toBeCloseTo(0.5);
  });

  it('replays an active tower when its reaction sequence changes', () => {
    const replayed = advanceTowerReaction({ progress: 1, sequence: 4 }, 0, true, 5, false);
    const replayMidpoint = advanceTowerReaction(replayed, 0.525, true, 5, false);

    expect(replayed).toEqual({ progress: 0, sequence: 5 });
    expect(replayMidpoint.progress).toBeCloseTo(0.5);
  });

  it('snaps reduced-motion towers to their correct held pose', () => {
    expect(advanceTowerReaction({ progress: 0.4, sequence: 2 }, 0, true, 2, true).progress).toBe(1);
    expect(advanceTowerReaction({ progress: 0.6, sequence: 2 }, 0, false, 2, true).progress).toBe(0);
  });

  it('unfolds the Project Court terraces before flying and seating its gantry', () => {
    const neutral = {
      rearSlabYaw: -Math.PI / 2,
      rearSlabLift: 0,
      frontSlabYaw: 0,
      frontSlabLift: 0,
      gantryPosition: [-0.54, 2.2, -0.74],
      gantryYaw: Math.PI / 2,
      gantryScaleZ: 0.22,
    };
    const held = {
      rearSlabYaw: 0,
      rearSlabLift: 0,
      frontSlabYaw: -Math.PI / 2,
      frontSlabLift: 0,
      gantryPosition: [-0.02, 2.32, -0.01],
      gantryYaw: 0.752,
      gantryScaleZ: 1,
    };

    expect(projectCourtPose(-1)).toEqual(neutral);
    expect(projectCourtPose(0)).toEqual(neutral);

    const early = projectCourtPose(0.2);
    expect(early.rearSlabYaw).toBe(neutral.rearSlabYaw);
    expect(early.rearSlabLift).toBe(0);
    expect(early.frontSlabYaw).toBeLessThan(neutral.frontSlabYaw);
    expect(early.frontSlabLift).toBeGreaterThan(0);
    expect(early.gantryPosition).toEqual(neutral.gantryPosition);
    expect(early.gantryScaleZ).toBe(neutral.gantryScaleZ);

    const rearUnfold = projectCourtPose(0.55);
    expect(rearUnfold.rearSlabYaw).toBeGreaterThan(neutral.rearSlabYaw);
    expect(rearUnfold.rearSlabLift).toBeGreaterThan(0);

    const takeoff = projectCourtPose(0.44);
    expect(takeoff.rearSlabYaw).toBe(neutral.rearSlabYaw);
    expect(takeoff.gantryPosition[1]).toBeGreaterThan(neutral.gantryPosition[1]);
    expect(takeoff.gantryPosition[0]).toBe(neutral.gantryPosition[0]);
    expect(takeoff.gantryYaw).toBe(neutral.gantryYaw);
    expect(takeoff.gantryScaleZ).toBe(neutral.gantryScaleZ);

    const airborne = projectCourtPose(0.7);
    expect(airborne.gantryPosition[1]).toBeCloseTo(2.68);
    expect(airborne.gantryPosition[0]).toBeGreaterThan(neutral.gantryPosition[0]);
    expect(airborne.gantryYaw).toBeLessThan(neutral.gantryYaw);
    expect(airborne.gantryScaleZ).toBeGreaterThan(neutral.gantryScaleZ);

    const landing = projectCourtPose(0.9);
    expect(landing.gantryPosition[0]).toBeCloseTo(held.gantryPosition[0]);
    expect(landing.gantryPosition[2]).toBeCloseTo(held.gantryPosition[2]);
    expect(landing.gantryPosition[1]).toBeGreaterThan(held.gantryPosition[1]);
    expect(landing.gantryScaleZ).toBe(held.gantryScaleZ);

    expect(projectCourtPose(1)).toEqual(held);
    expect(projectCourtPose(2)).toEqual(held);

    const halfSpan = 1.29 / 2;
    const endpoint = (direction: -1 | 1) => [
      held.gantryPosition[0] + Math.sin(held.gantryYaw) * halfSpan * direction,
      held.gantryPosition[1] - 0.16 / 2,
      held.gantryPosition[2] + Math.cos(held.gantryYaw) * halfSpan * direction,
    ] as const;
    const rearEndpoint = endpoint(-1);
    const frontEndpoint = endpoint(1);
    expect(rearEndpoint[0]).toBeCloseTo(-0.46, 2);
    expect(rearEndpoint[2]).toBeCloseTo(-0.48, 2);
    expect(frontEndpoint[0]).toBeCloseTo(0.42, 2);
    expect(frontEndpoint[2]).toBeCloseTo(0.46, 2);
    expect(rearEndpoint[1]).toBeCloseTo(2.24, 2);
    expect(frontEndpoint[1]).toBeCloseTo(2.24, 2);
  });

  it('gives the Project Court gantry a bounded idle cradle hover at neutral and seated tension when held', () => {
    const neutral = projectCourtAmbientPose(1.25, false, false);
    const held = projectCourtAmbientPose(1.25, true, false);

    expect(neutral.rearSlabLift).toBe(0);
    expect(neutral.frontSlabLift).toBe(0);
    expect(Math.abs(neutral.gantryYOffset)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(neutral.gantryYawOffset)).toBeLessThanOrEqual(0.04);
    expect(Math.abs(neutral.gantryScaleZOffset)).toBeLessThanOrEqual(0.03);

    expect(Math.abs(held.rearSlabLift)).toBeLessThanOrEqual(0.018);
    expect(Math.abs(held.frontSlabLift)).toBeLessThanOrEqual(0.018);
    expect(Math.abs(held.gantryYOffset)).toBeLessThanOrEqual(0.035);
    expect(Math.abs(held.gantryYawOffset)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(held.gantryScaleZOffset)).toBeLessThanOrEqual(0.022);

    expect(projectCourtAmbientPose(2, false, true)).toEqual({
      rearSlabLift: 0,
      frontSlabLift: 0,
      gantryYOffset: 0,
      gantryYawOffset: 0,
      gantryScaleZOffset: 0,
    });
    expect(neutral).not.toEqual(held);
  });

  it('unlocks the Index Engine chambers bottom-to-top and then splits its crown', () => {
    expect(INDEX_ENGINE_REACTION_DURATIONS).toEqual({ arrival: 1.4, exit: 0.8 });

    const neutral = Array.from({ length: 4 }, (_unused, index) => indexEngineChamberPose(0, index));
    expect(indexEngineChamberPose(0.15, 0)).toEqual(neutral[0]);
    expect(indexEngineChamberPose(0.46, 0)).not.toEqual(neutral[0]);
    expect(indexEngineChamberPose(0.46, 3)).toEqual(neutral[3]);
    expect(indexEngineChamberPose(0.76, 2)).not.toEqual(neutral[2]);

    const crownNeutral = indexEngineCrownHalfPose(0.77, 0);
    const crownOpening = indexEngineCrownHalfPose(0.9, 0);
    expect(crownOpening.position).not.toEqual(crownNeutral.position);
    expect(indexEngineCrownHalfPose(0.9, 0).position[0]).toBeGreaterThan(0);
    expect(indexEngineCrownHalfPose(0.9, 1).position[0]).toBeLessThan(0);
  });

  it('starts the coral cap on the guide base and climbs to the crown on arrival', () => {
    const atBase = indexEngineCarriagePose(0);
    const climbing = indexEngineCarriagePose(0.5);
    const approach = indexEngineCarriagePose(0.94);
    const docking = indexEngineCarriagePose(0.97);
    const atCrown = indexEngineCarriagePose(1);

    expect(atBase.position[1]).toBeCloseTo(0.55);
    expect(climbing.position[1]).toBeGreaterThan(atBase.position[1]);
    expect(climbing.position[1]).toBeLessThan(atCrown.position[1]!);
    expect(atCrown.position).toEqual([0, 4.38, 0]);
    expect(approach.position[1]).toBeLessThan(atCrown.position[1]!);
    expect(docking.position[1]).toBeGreaterThan(approach.position[1]!);
    expect(docking.position[1]).toBeLessThan(atCrown.position[1]!);
  });

  it('keeps the Index Engine carriage climb monotonic during arrival', () => {
    const samples = Array.from(
      { length: 94 },
      (_unused, index) => indexEngineCarriagePose(index / 93).position[1],
    );

    samples.slice(1).forEach((y, index) => {
      expect(y, `sample ${index + 1}`).toBeGreaterThanOrEqual(samples[index]!);
    });
  });

  it('gives each chamber a bounded idle flutter at neutral and held progress', () => {
    const neutral = Array.from({ length: 4 }, (_unused, index) => (
      indexEngineChamberAmbientPose(1.25, index, false)
    ));
    const held = Array.from({ length: 4 }, (_unused, index) => (
      indexEngineChamberAmbientPose(4.75, index, false)
    ));

    [...neutral, ...held].forEach((pose) => {
      expect(Math.abs(pose.position[0])).toBeLessThanOrEqual(0.02);
      expect(Math.abs(pose.position[1])).toBeLessThanOrEqual(0.03);
      expect(Math.abs(pose.position[2])).toBeLessThanOrEqual(0.02);
      expect(Math.abs(pose.rotation[0])).toBeLessThanOrEqual(0.03);
      expect(Math.abs(pose.rotation[1])).toBeLessThanOrEqual(0.04);
      expect(Math.abs(pose.rotation[2])).toBeLessThanOrEqual(0.03);
    });
    expect(indexEngineChamberAmbientPose(2, 0, true)).toEqual({
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    });
    expect(neutral[0]).not.toEqual(neutral[1]);
  });

  it('keeps Index Engine poses finite, clamped, and still once held', () => {
    const poses = [
      indexEngineChamberPose(-1, 0),
      indexEngineChamberPose(2, 3),
      indexEngineCrownHalfPose(-1, 0),
      indexEngineCrownHalfPose(2, 1),
      indexEngineCarriagePose(-1),
      indexEngineCarriagePose(2),
    ];

    expect(indexEngineChamberPose(-1, 0)).toEqual(indexEngineChamberPose(0, 0));
    expect(indexEngineChamberPose(2, 3)).toEqual(indexEngineChamberPose(1, 3));
    expect(indexEngineCrownHalfPose(-1, 0)).toEqual(indexEngineCrownHalfPose(0, 0));
    expect(indexEngineCrownHalfPose(2, 1)).toEqual(indexEngineCrownHalfPose(1, 1));
    expect(indexEngineCarriagePose(-1)).toEqual(indexEngineCarriagePose(0));
    expect(indexEngineCarriagePose(2)).toEqual(indexEngineCarriagePose(1));
    expect(poses.flatMap((pose) => [...pose.position, ...pose.rotation]).every(Number.isFinite)).toBe(true);
  });

  it('keeps the neutral carriage ambient offset subtle and removes it for reduced motion', () => {
    expect(indexEngineAmbientCarriageOffset(2, true)).toBe(0);
    for (const elapsed of [0, 0.25, 0.5, 1.2, 2.4]) {
      expect(Math.abs(indexEngineAmbientCarriageOffset(elapsed, false))).toBeLessThanOrEqual(0.03);
    }
  });

  it('counter-spins the Paradox Gate frames while idle', () => {
    expect(paradoxFrameIdleSpin(2, 0, true)).toEqual({ rotationY: 0, rotationZ: 0 });
    const first = paradoxFrameIdleSpin(2, 0, false);
    const second = paradoxFrameIdleSpin(2, 1, false);
    expect(first.rotationY).toBeCloseTo(0.36);
    expect(second.rotationY).toBeCloseTo(-0.48);
    expect(first.rotationY).not.toBeCloseTo(second.rotationY);
    expect(first.rotationZ).not.toBe(0);
    expect(paradoxFrameIdleSpin(2, 2, false).rotationZ).toBe(0);
  });

  it('aligns the Paradox Gate frames and locks its cube in the aperture', () => {
    const first = paradoxFramePose(1, 0);
    const second = paradoxFramePose(1, 1);
    const third = paradoxFramePose(1, 2);
    expect([first.rotationZ, second.rotationZ, third.rotationZ]).toEqual([
      0,
      Math.PI / 4,
      Math.PI / 2,
    ]);
    expect(first.rotationY).toBe(0);
    expect(second.rotationY).toBe(0);
    expect(third.rotationY).toBe(0);

    const travelling = paradoxCubePose(0.5, 3.2, 2.25);
    const held = paradoxCubePose(1, 3.2, 2.25);
    expect(Math.hypot(travelling.x, travelling.z)).toBeGreaterThan(0.1);
    expect(held).toEqual({ x: 0, y: 2.25, z: 0, rotationY: Math.PI });
  });

  it('aligns the Orrery rings and holds its beam toward the habitat', () => {
    expect(orreryRingPose(0, 0, 0.4)).not.toEqual(orreryRingPose(0, 1, 0.4));
    expect(orreryRingPose(1, 0, 0.4)).toEqual(orreryRingPose(1, 2, 0.4));
    expect(orreryRingPose(1, 0, 0.4)).toEqual({
      rotationX: Math.PI / 2,
      rotationY: 0,
      rotationZ: 0,
    });

    const held = orreryBeamPose(1, -2.42);
    expect(held.yaw).toBeCloseTo(-2.42);
    expect(held.opacity).toBeCloseTo(0.34);
  });

  it('passively sweeps the Orrery beam while About is held open', () => {
    expect(orreryBeamSweep(0, false, false)).toBe(0);
    expect(orreryBeamSweep(0, true, true)).toBe(0);
    expect(orreryBeamSweep(0, true, false)).toBe(0);
    expect(orreryBeamSweep(Math.PI / (2 * 0.72), true, false)).toBeCloseTo(0.48);
    expect(orreryBeamSweep(1.2, true, false)).not.toBe(orreryBeamSweep(2.4, true, false));
  });
});
