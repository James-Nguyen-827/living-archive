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

/** Carousel rim bulbs: lit all night, dark by day until the hobbies zone is visited. */
export function carouselLightOpacity(elapsedSeconds: number, night: boolean, active: boolean, reducedMotion: boolean): number {
  if (!active) return night ? 0.6 : 0;
  if (reducedMotion) return night ? 0.95 : 0.85;
  const swing = Math.sin(elapsedSeconds * 3.2);
  return night ? 0.85 + swing * 0.15 : 0.45 + swing * 0.35;
}

export const CAROUSEL_IDLE_SPIN_SPEED = 0.25;

/** Carousel spin: a visit throws the ride up to five times idle, then it coasts back down over a few seconds. */
export function carouselSpinSpeed(elapsedSeconds: number, active: boolean, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  if (!active) return CAROUSEL_IDLE_SPIN_SPEED;
  const rise = Math.max(0, elapsedSeconds) / 0.6;
  return CAROUSEL_IDLE_SPIN_SPEED * (1 + 4 * rise * Math.exp(1 - rise));
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

/** Coral sculptures: warm beacon glow at night with a gentle idle pulse. */
export function coralBeaconGlow(elapsedSeconds: number, night: boolean, reducedMotion: boolean): number {
  if (!night) return 0;
  const idle = 0.9;
  if (reducedMotion) return idle;
  return idle + Math.sin(elapsedSeconds * 2.2) * 0.05;
}

/** Orrery rings and hub: always warm at night, brighter when About is active. */
export function orreryBeaconGlow(elapsedSeconds: number, night: boolean, active: boolean, reducedMotion: boolean): number {
  if (!night) return 0;
  const idle = 0.88;
  if (!active) return idle;
  const lit = 1;
  if (reducedMotion) return lit;
  return lit + Math.sin(elapsedSeconds * 2.2) * 0.05;
}

export const TOWER_ARRIVAL_DURATION = 1.05;
export const TOWER_EXIT_DURATION = 0.65;

export interface TowerReactionState {
  progress: number;
  sequence: number;
}

/** Shared reversible tower state. A new sequence replays an already-active landmark. */
export function advanceTowerReaction(
  state: TowerReactionState,
  deltaSeconds: number,
  active: boolean,
  reactionSequence: number,
  reducedMotion: boolean,
): TowerReactionState {
  if (reducedMotion) {
    return { progress: active ? 1 : 0, sequence: reactionSequence };
  }

  const replaying = active && reactionSequence !== state.sequence;
  const start = replaying ? 0 : state.progress;
  const duration = active ? TOWER_ARRIVAL_DURATION : TOWER_EXIT_DURATION;
  const direction = active ? 1 : -1;
  return {
    progress: Math.min(1, Math.max(0, start + direction * Math.max(0, deltaSeconds) / duration)),
    sequence: reactionSequence,
  };
}

export interface ProjectCourtPose {
  rearSlabYaw: number;
  frontSlabYaw: number;
  bridgeRoll: number;
  bridgeLift: number;
}

function stagedTowerProgress(progress: number, start: number, end: number): number {
  return easeOutQuint((progress - start) / (end - start));
}

/** Work Project Court: two quarter-turn slabs resolve before the coral bridge closes. */
export function projectCourtPose(progress: number): ProjectCourtPose {
  const clamped = Math.min(1, Math.max(0, progress));
  const rearProgress = stagedTowerProgress(clamped, 0, 0.54);
  const frontProgress = stagedTowerProgress(clamped, 0.14, 0.7);
  const bridgeProgress = stagedTowerProgress(clamped, 0.58, 1);
  return {
    rearSlabYaw: -Math.PI / 2 + rearProgress * Math.PI / 2,
    frontSlabYaw: frontProgress === 0 ? 0 : -frontProgress * Math.PI / 2,
    bridgeRoll: (1 - bridgeProgress) * Math.PI / 2,
    bridgeLift: (1 - bridgeProgress) * 0.18,
  };
}

/** Field Notes Pagewell: five folios open bottom-to-top around the hollow spine. */
export function pagewellFolioYaw(progress: number, folioIndex: number): number {
  const neutral = folioIndex * 0.04;
  const target = folioIndex === 0 ? 0.24 : folioIndex * Math.PI / 5;
  const delay = folioIndex * 0.12;
  const local = Math.min(1, Math.max(0, (progress - delay) / 0.52));
  return neutral + (target - neutral) * easeOutQuint(local);
}

export function pagewellBookmarkTilt(progress: number): number {
  return easeOutQuint(progress) * 0.35;
}

export interface ParadoxFramePose {
  rotationY: number;
  rotationZ: number;
}

const PARADOX_IDLE_Y = [0.24, -0.3, 0.2] as const;
const PARADOX_IDLE_Z = [-0.18, 0.12, -0.22] as const;

const PARADOX_FRAME_SPIN_Y = [0.18, -0.24, 0.14] as const;

/** Experiments Paradox Gate: nested frames counter-spin while idle. */
export function paradoxFrameIdleSpin(
  elapsedSeconds: number,
  frameIndex: number,
  reducedMotion: boolean,
): ParadoxFramePose {
  if (reducedMotion) return { rotationY: 0, rotationZ: 0 };
  const index = Math.min(2, Math.max(0, frameIndex));
  return {
    rotationY: elapsedSeconds * PARADOX_FRAME_SPIN_Y[index]!,
    rotationZ: index === 0 ? Math.sin(elapsedSeconds * 0.7) * 0.04 : 0,
  };
}

/** Experiments Paradox Gate: nested frames resolve into a 0/45/90-degree aperture. */
export function paradoxFramePose(progress: number, frameIndex: number): ParadoxFramePose {
  const index = Math.min(2, Math.max(0, frameIndex));
  const delay = index * 0.1;
  const local = Math.min(1, Math.max(0, (progress - delay) / 0.72));
  const eased = easeOutQuint(local);
  if (local === 1) return { rotationY: 0, rotationZ: index * Math.PI / 4 };
  return {
    rotationY: PARADOX_IDLE_Y[index] * (1 - eased),
    rotationZ: PARADOX_IDLE_Z[index] + (index * Math.PI / 4 - PARADOX_IDLE_Z[index]) * eased,
  };
}

export interface ParadoxCubePose {
  x: number;
  y: number;
  z: number;
  rotationY: number;
}

export function paradoxCubePose(progress: number, floatY: number, apertureY: number): ParadoxCubePose {
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped === 0) return { x: 0, y: floatY, z: 0, rotationY: 0 };
  if (clamped === 1) return { x: 0, y: apertureY, z: 0, rotationY: Math.PI };
  const eased = easeInOutCubic(clamped);
  return {
    x: Math.sin(clamped * Math.PI * 2) * 0.28 * (1 - clamped),
    y: floatY + (apertureY - floatY) * eased,
    z: Math.sin(clamped * Math.PI) * 0.22,
    rotationY: eased * Math.PI,
  };
}

export interface OrreryRingPose {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

const ORRERY_IDLE_ROTATIONS: readonly OrreryRingPose[] = [
  { rotationX: Math.PI / 2, rotationY: 0, rotationZ: 0 },
  { rotationX: Math.PI / 3, rotationY: 0, rotationZ: Math.PI / 3 },
  { rotationX: Math.PI * 0.72, rotationY: 0, rotationZ: -Math.PI / 3 },
];

/** About Orrery: distinct idle planes converge into one held halo. */
export function orreryRingPose(progress: number, ringIndex: number, ambientAngle: number): OrreryRingPose {
  const index = Math.min(2, Math.max(0, ringIndex));
  const idle = ORRERY_IDLE_ROTATIONS[index]!;
  const spinDirection = index % 2 === 0 ? 1 : -0.72;
  const eased = easeOutQuint(progress);
  if (eased === 1) return { rotationX: Math.PI / 2, rotationY: 0, rotationZ: 0 };
  return {
    rotationX: idle.rotationX + (Math.PI / 2 - idle.rotationX) * eased,
    rotationY: (ambientAngle * spinDirection) * (1 - eased),
    rotationZ: idle.rotationZ * (1 - eased),
  };
}

export function orreryBeamPose(progress: number, inwardYaw: number): { yaw: number; opacity: number } {
  const eased = easeOutQuint(progress);
  return {
    yaw: inwardYaw - 0.9 * (1 - eased),
    opacity: eased * 0.34,
  };
}

const ARCHIVE_SLAB_TWIST = Math.PI / 30;

/** Notes archive: base twist per slab plus a visit riffle. */
export function pageRiffleYaw(elapsedSeconds: number, slabIndex: number, active: boolean, reducedMotion: boolean): number {
  const base = slabIndex * ARCHIVE_SLAB_TWIST;
  if (!active) return base;
  if (reducedMotion) return base + 0.14;
  const delay = slabIndex * 0.055;
  const local = Math.max(0, elapsedSeconds - delay);
  const wave = easeOutQuint(Math.min(1, local / 0.42));
  return base + wave * 0.24 * Math.sin(local * 4.2);
}

/** Notes archive: top slabs breathe when idle. */
export function pageBreathYaw(elapsedSeconds: number, slabIndex: number, slabCount: number, reducedMotion: boolean): number {
  if (reducedMotion || slabIndex < slabCount - 2) return 0;
  return Math.sin(elapsedSeconds * 1.35 + slabIndex * 0.6) * 0.028;
}

export function pageBookmarkTip(elapsedSeconds: number, active: boolean, reducedMotion: boolean): number {
  if (!active) return 0;
  if (reducedMotion) return 0.22;
  return easeOutQuint(Math.min(1, elapsedSeconds / 0.62)) * 0.22;
}

/** Experiments gate: floating cube bobs idle and slots through the lintel on visit. */
export function gateBlockPose(
  elapsedSeconds: number,
  active: boolean,
  reducedMotion: boolean,
  floatY: number,
  slotY: number,
): { y: number; rotationY: number } {
  const ambientBob = reducedMotion ? 0 : Math.sin(elapsedSeconds * 0.85) * 0.07;
  const ambientTurn = reducedMotion ? 0 : elapsedSeconds * 0.11;
  if (!active) return { y: floatY + ambientBob, rotationY: ambientTurn };
  if (reducedMotion) return { y: floatY, rotationY: Math.PI / 2 };
  const progress = Math.min(1, elapsedSeconds / 0.62);
  if (progress < 0.38) {
    const t = easeOutQuint(progress / 0.38);
    return { y: floatY + (slotY - floatY) * t, rotationY: ambientTurn };
  }
  if (progress < 0.52) {
    const t = easeOutQuint((progress - 0.38) / 0.14);
    return { y: slotY, rotationY: t * (Math.PI / 2) };
  }
  const t = easeOutQuint((progress - 0.52) / 0.48);
  return { y: slotY + (floatY - slotY) * t, rotationY: (Math.PI / 2) * (1 - t) };
}

/** About lighthouse armillary rings: counter-rotate faster on visit. */
export function lanternRingSpin(elapsedSeconds: number, active: boolean, reducedMotion: boolean): { inner: number; outer: number } {
  const idle = 0.07;
  if (reducedMotion) {
    return active ? { inner: 0.45, outer: -0.32 } : { inner: 0, outer: 0 };
  }
  const speed = active ? idle + Math.exp(-elapsedSeconds * 1.4) * 1.35 : idle;
  return { inner: elapsedSeconds * speed, outer: elapsedSeconds * -speed * 0.72 };
}

/** About lighthouse beam sweeps when the zone is active. */
export function lighthouseBeamSweep(elapsedSeconds: number, active: boolean, reducedMotion: boolean): number {
  if (!active) return 0;
  if (reducedMotion) return Math.PI / 5;
  return Math.sin(elapsedSeconds * 2.6) * 0.55;
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
