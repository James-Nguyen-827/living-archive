import type { GridPoint } from './world-types';

export function easeOutQuint(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return 1 - (1 - clamped) ** 5;
}

export function easeInOutCubic(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - ((-2 * clamped + 2) ** 3) / 2;
}

export function cameraReframeProgress(elapsedSeconds: number, durationSeconds = 0.9): number {
  return easeInOutCubic(elapsedSeconds / durationSeconds);
}

export function nearestEquivalentAngle(current: number, target: number): number {
  const shortestDelta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + shortestDelta;
}

export function angleFromDrag(
  startAngle: number,
  startX: number,
  currentX: number,
  sensitivity = 0.008,
): number {
  return startAngle - (currentX - startX) * sensitivity;
}

export function nudgeAngle(angle: number, direction: -1 | 1): number {
  return angle + direction * Math.PI / 8;
}

export function degreesForAngle(angle: number): number {
  const degrees = Math.round(angle * 180 / Math.PI);
  return ((degrees % 360) + 360) % 360;
}

export function travelerStepDuration(edgeCount: number): number {
  if (edgeCount <= 0) return 0;
  return Math.max(100, Math.min(180, 1_400 / edgeCount));
}

export function themeTransitionProgress(elapsedSeconds: number): number {
  return easeOutQuint(elapsedSeconds / 0.9);
}

/** Work signal-bar growth: reduced motion snaps to the finished pose. */
export function signalBarProgress(elapsedSeconds: number, active: boolean, reducedMotion: boolean): number {
  if (!active) return 0;
  if (reducedMotion) return 1;
  return easeOutQuint(elapsedSeconds / 0.32);
}

/** About ring expansion: reduced motion snaps to the finished radius with no fade residual. */
export function aboutSignalPose(elapsedSeconds: number, active: boolean, reducedMotion: boolean): { scale: number; opacity: number } {
  if (!active) return { scale: 0.01, opacity: 0 };
  if (reducedMotion) return { scale: 2.9, opacity: 0 };
  const progress = Math.min(1, elapsedSeconds / 0.8);
  return {
    scale: 0.4 + easeOutQuint(progress) * 2.5,
    opacity: (1 - progress) * 0.45,
  };
}

function clean(value: number): number {
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** Carousel rim bulbs: reduced motion holds the lit state instead of pulsing. */
export function carouselLightOpacity(elapsedSeconds: number, active: boolean, reducedMotion: boolean): number {
  if (!active) return 0;
  if (reducedMotion) return 0.85;
  return 0.45 + Math.sin(elapsedSeconds * 3.2) * 0.35;
}

/** Tower windows: warm lamplight after dusk, barely-there in daylight; reduced motion holds a steady value. */
export function towerWindowGlow(elapsedSeconds: number, night: boolean, active: boolean, reducedMotion: boolean): number {
  const idle = night ? 0.8 : 0.16;
  if (!active) return idle;
  const lit = night ? 0.94 : 0.62;
  if (reducedMotion) return lit;
  const swing = night ? 0.06 : 0.22;
  return lit + Math.sin(elapsedSeconds * 2.8) * swing;
}

export function rotatePointY(point: GridPoint, angle: number): GridPoint {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [
    clean(point[0] * cosine + point[2] * sine),
    point[1],
    clean(-point[0] * sine + point[2] * cosine),
  ];
}
