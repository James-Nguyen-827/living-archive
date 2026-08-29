import { describe, expect, it } from 'vitest';
import {
  aboutSignalPose,
  angleFromDrag,
  cameraReframeProgress,
  degreesForAngle,
  easeInOutCubic,
  easeOutQuint,
  nearestEquivalentAngle,
  nudgeAngle,
  carouselLightOpacity,
  carouselSpinSpeed,
  CAROUSEL_IDLE_SPIN_SPEED,
  advanceTowerReaction,
  gateBlockPose,
  lanternRingSpin,
  orreryBeamPose,
  orreryRingPose,
  pagewellBookmarkTilt,
  pagewellFolioYaw,
  pageRiffleYaw,
  paradoxCubePose,
  paradoxFrameIdleSpin,
  paradoxFramePose,
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
    expect(aboutSignalPose(0, true, true)).toEqual({ scale: 2.9, opacity: 0 });
    expect(aboutSignalPose(0.8, true, false).scale).toBeCloseTo(2.9);
    expect(aboutSignalPose(0.8, true, false).opacity).toBe(0);
    expect(aboutSignalPose(0, false, false)).toEqual({ scale: 0.01, opacity: 0 });
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

  it('stages the Project Court slabs before lowering its coral bridge', () => {
    const neutral = {
      rearSlabYaw: -Math.PI / 2,
      frontSlabYaw: 0,
      bridgeRoll: Math.PI / 2,
      bridgeLift: 0.18,
    };
    const held = {
      rearSlabYaw: 0,
      frontSlabYaw: -Math.PI / 2,
      bridgeRoll: 0,
      bridgeLift: 0,
    };

    expect(projectCourtPose(-1)).toEqual(neutral);
    expect(projectCourtPose(0)).toEqual(neutral);

    const early = projectCourtPose(0.1);
    expect(early.rearSlabYaw).toBeGreaterThan(neutral.rearSlabYaw);
    expect(early.frontSlabYaw).toBe(neutral.frontSlabYaw);
    expect(early.bridgeRoll).toBe(neutral.bridgeRoll);

    const midpoint = projectCourtPose(0.5);
    expect(midpoint.rearSlabYaw).toBeGreaterThan(early.rearSlabYaw);
    expect(midpoint.frontSlabYaw).toBeLessThan(neutral.frontSlabYaw);
    expect(midpoint.bridgeRoll).toBe(neutral.bridgeRoll);

    const closing = projectCourtPose(0.75);
    expect(closing.bridgeRoll).toBeLessThan(neutral.bridgeRoll);
    expect(closing.bridgeLift).toBeLessThan(neutral.bridgeLift);

    expect(projectCourtPose(1)).toEqual(held);
    expect(projectCourtPose(2)).toEqual(held);
  });

  it('fans the Pagewell folios in a rising wave and tips its bookmark', () => {
    expect(pagewellFolioYaw(0, 4)).toBeCloseTo(0.16);
    expect(pagewellFolioYaw(0.45, 0)).toBeGreaterThan(pagewellFolioYaw(0, 0));
    expect(pagewellFolioYaw(0.45, 0)).toBeGreaterThan(pagewellFolioYaw(0.45, 4));
    expect(pagewellFolioYaw(1, 4)).toBeCloseTo(4 * Math.PI / 5);
    expect(pagewellBookmarkTilt(1)).toBeCloseTo(0.35);
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
});
