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

  it('keeps carousel bulbs dark until the hobbies zone is visited', () => {
    expect(carouselLightOpacity(0, false, false)).toBe(0);
    expect(carouselLightOpacity(1.2, false, true)).toBe(0);
  });

  it('holds carousel bulbs lit under reduced motion and pulses them otherwise', () => {
    expect(carouselLightOpacity(0, true, true)).toBe(0.85);
    for (const elapsed of [0, 0.25, 0.5, 1.4]) {
      const opacity = carouselLightOpacity(elapsed, true, false);
      expect(opacity).toBeGreaterThanOrEqual(0.1);
      expect(opacity).toBeLessThanOrEqual(0.8);
    }
    expect(carouselLightOpacity(0, true, false)).not.toBe(carouselLightOpacity(0.4, true, false));
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
});
