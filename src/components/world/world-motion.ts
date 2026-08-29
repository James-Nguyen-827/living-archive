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

/** Carousel bulbs breathe in and out while lit, using the same cadence as the orrery rings. */
export function carouselBulbGlow(elapsedSeconds: number, night: boolean, active: boolean, reducedMotion: boolean): number {
  const lit = carouselLightOpacity(elapsedSeconds, night, active, reducedMotion);
  if (lit <= 0) return 0;
  if (reducedMotion) return lit;
  return lit * (0.72 + Math.sin(elapsedSeconds * 2.2) * 0.28);
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
export const PROJECT_COURT_REACTION_DURATIONS = { arrival: 1.4, exit: 0.8 } as const;
export const INDEX_ENGINE_REACTION_DURATIONS = { arrival: 1.4, exit: 0.8 } as const;

export interface TowerReactionDurations {
  arrival: number;
  exit: number;
}

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
  durations: TowerReactionDurations = {
    arrival: TOWER_ARRIVAL_DURATION,
    exit: TOWER_EXIT_DURATION,
  },
): TowerReactionState {
  if (reducedMotion) {
    return { progress: active ? 1 : 0, sequence: reactionSequence };
  }

  const replaying = active && reactionSequence !== state.sequence;
  const start = replaying ? 0 : state.progress;
  const duration = active ? durations.arrival : durations.exit;
  const direction = active ? 1 : -1;
  return {
    progress: Math.min(1, Math.max(0, start + direction * Math.max(0, deltaSeconds) / duration)),
    sequence: reactionSequence,
  };
}

export interface ProjectCourtPose {
  rearSlabYaw: number;
  rearSlabLift: number;
  frontSlabYaw: number;
  frontSlabLift: number;
  gantryPosition: GridPoint;
  gantryYaw: number;
  gantryScaleZ: number;
}

const PROJECT_COURT_NEUTRAL_POSE: ProjectCourtPose = {
  rearSlabYaw: -Math.PI / 2,
  rearSlabLift: 0,
  frontSlabYaw: 0,
  frontSlabLift: 0,
  gantryPosition: [-0.54, 2.2, -0.74],
  gantryYaw: Math.PI / 2,
  gantryScaleZ: 0.22,
};

const PROJECT_COURT_HELD_POSE: ProjectCourtPose = {
  rearSlabYaw: 0,
  rearSlabLift: 0,
  frontSlabYaw: -Math.PI / 2,
  frontSlabLift: 0,
  gantryPosition: [-0.02, 2.32, -0.01],
  gantryYaw: 0.752,
  gantryScaleZ: 1,
};

function stagedTowerProgress(progress: number, start: number, end: number): number {
  return easeOutQuint((progress - start) / (end - start));
}

function stagedEaseInOutProgress(progress: number, start: number, end: number): number {
  return easeInOutCubic((progress - start) / (end - start));
}

function stagedArcLift(progress: number, start: number, end: number, height: number): number {
  if (progress <= start || progress >= end) return 0;
  return Math.sin(Math.PI * stagedEaseInOutProgress(progress, start, end)) * height;
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

/** Work Project Court: two terraces unfold before a compact gantry flies and seats. */
export function projectCourtPose(progress: number): ProjectCourtPose {
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped === 0) return PROJECT_COURT_NEUTRAL_POSE;
  if (clamped === 1) return PROJECT_COURT_HELD_POSE;
  const rearProgress = stagedTowerProgress(clamped, 0.48, 0.9);
  const frontProgress = stagedTowerProgress(clamped, 0.1, 0.54);
  const liftProgress = stagedEaseInOutProgress(clamped, 0.32, 0.56);
  const travelProgress = stagedEaseInOutProgress(clamped, 0.48, 0.72);
  const yawProgress = stagedTowerProgress(clamped, 0.48, 0.72);
  const extensionProgress = stagedTowerProgress(clamped, 0.6, 0.82);
  const landingProgress = stagedTowerProgress(clamped, 0.8, 1);
  const flightY = lerp(2.2, 2.68, liftProgress);
  return {
    rearSlabYaw: -Math.PI / 2 + rearProgress * Math.PI / 2,
    rearSlabLift: stagedArcLift(clamped, 0.48, 0.9, 0.24),
    frontSlabYaw: frontProgress === 0 ? 0 : -frontProgress * Math.PI / 2,
    frontSlabLift: stagedArcLift(clamped, 0.1, 0.54, 0.18),
    gantryPosition: [
      lerp(-0.54, -0.02, travelProgress),
      lerp(flightY, 2.32, landingProgress),
      lerp(-0.74, -0.01, travelProgress),
    ],
    gantryYaw: lerp(Math.PI / 2, 0.752, yawProgress),
    gantryScaleZ: lerp(0.22, 1, extensionProgress),
  };
}

export interface IndexEnginePiecePose {
  position: GridPoint;
  rotation: GridPoint;
}

export interface IndexEngineCarriagePose extends IndexEnginePiecePose {}

const INDEX_ENGINE_CHAMBER_NEUTRAL: readonly IndexEnginePiecePose[] = [
  { position: [0.38, 0.85, 0.15], rotation: [0, 0, 0] },
  { position: [-0.3, 1.63, -0.16], rotation: [0, Math.PI / 2, 0] },
  { position: [0.28, 2.4, -0.15], rotation: [0, Math.PI, 0] },
  { position: [-0.35, 3.16, 0.14], rotation: [0, Math.PI * 1.5, 0] },
];

const INDEX_ENGINE_CHAMBER_HELD: readonly IndexEnginePiecePose[] = [
  { position: [0.52, 1.06, 0.37], rotation: [0.18, 0.32, 0.12] },
  { position: [-0.53, 1.83, -0.4], rotation: [-0.14, Math.PI / 2 - 0.28, -0.16] },
  { position: [0.5, 2.62, 0.38], rotation: [0.16, Math.PI + 0.3, 0.14] },
  { position: [-0.52, 3.42, -0.4], rotation: [-0.18, Math.PI * 1.5 - 0.32, -0.12] },
];

const INDEX_ENGINE_CROWN_NEUTRAL: readonly IndexEnginePiecePose[] = [
  { position: [0.2, 4, 0.1], rotation: [0, 0, 0] },
  { position: [-0.2, 4, -0.1], rotation: [0, Math.PI, 0] },
];

const INDEX_ENGINE_CROWN_HELD: readonly IndexEnginePiecePose[] = [
  { position: [0.52, 4.14, 0.38], rotation: [0.12, 0.28, 0.2] },
  { position: [-0.52, 4.14, -0.38], rotation: [-0.12, Math.PI - 0.28, -0.2] },
];

const INDEX_ENGINE_CHAMBER_STAGES = [
  [0.16, 0.5],
  [0.3, 0.64],
  [0.44, 0.78],
  [0.58, 0.9],
] as const;

function clampUnit(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

function lerpPoint(from: GridPoint, to: GridPoint, progress: number): GridPoint {
  return [
    lerp(from[0], to[0], progress),
    lerp(from[1], to[1], progress),
    lerp(from[2], to[2], progress),
  ];
}

function indexEnginePoseBetween(
  progress: number,
  start: number,
  end: number,
  neutral: IndexEnginePiecePose,
  held: IndexEnginePiecePose,
): IndexEnginePiecePose {
  const local = easeOutQuint((clampUnit(progress) - start) / (end - start));
  return {
    position: lerpPoint(neutral.position, held.position, local),
    rotation: lerpPoint(neutral.rotation, held.rotation, local),
  };
}

/** Field Notes Index Engine: four chamber C-pieces unlock bottom-to-top into cantilevers. */
export function indexEngineChamberPose(progress: number, chamberIndex: number): IndexEnginePiecePose {
  const index = Math.min(INDEX_ENGINE_CHAMBER_NEUTRAL.length - 1, Math.max(0, Math.trunc(chamberIndex)));
  const [start, end] = INDEX_ENGINE_CHAMBER_STAGES[index]!;
  return indexEnginePoseBetween(
    progress,
    start,
    end,
    INDEX_ENGINE_CHAMBER_NEUTRAL[index]!,
    INDEX_ENGINE_CHAMBER_HELD[index]!,
  );
}

/** Field Notes Index Engine: crown C-pieces split late, holding the final negative space open. */
export function indexEngineCrownHalfPose(progress: number, crownIndex: number): IndexEnginePiecePose {
  const index = Math.min(INDEX_ENGINE_CROWN_NEUTRAL.length - 1, Math.max(0, Math.trunc(crownIndex)));
  return indexEnginePoseBetween(
    progress,
    0.78,
    0.96,
    INDEX_ENGINE_CROWN_NEUTRAL[index]!,
    INDEX_ENGINE_CROWN_HELD[index]!,
  );
}

const INDEX_ENGINE_CARRIAGE_CROWN: IndexEngineCarriagePose = {
  position: [0, 4.38, 0],
  rotation: [0, 0, 0],
};

const INDEX_ENGINE_CARRIAGE_EXTERIOR: IndexEngineCarriagePose = {
  position: [0.68, 4.15, -0.55],
  rotation: [0, 0.28, 0],
};

const INDEX_ENGINE_CARRIAGE_BASE: IndexEngineCarriagePose = {
  position: [0.68, 0.55, -0.55],
  rotation: [0, 0.28, 0],
};

const INDEX_ENGINE_CARRIAGE_APPROACH: IndexEngineCarriagePose = {
  position: [0.68, 4.12, -0.55],
  rotation: [0, 0.28, 0],
};

function carriagePoseBetween(
  from: IndexEngineCarriagePose,
  to: IndexEngineCarriagePose,
  progress: number,
): IndexEngineCarriagePose {
  return {
    position: lerpPoint(from.position, to.position, easeInOutCubic(progress)),
    rotation: lerpPoint(from.rotation, to.rotation, easeInOutCubic(progress)),
  };
}

/** Field Notes Index Engine: coral cap drops, climbs the guide path, then re-docks at the crown. */
export function indexEngineCarriagePose(progress: number): IndexEngineCarriagePose {
  const clamped = clampUnit(progress);
  if (clamped === 0 || clamped === 1) return INDEX_ENGINE_CARRIAGE_CROWN;
  if (clamped <= 0.06) return carriagePoseBetween(
    INDEX_ENGINE_CARRIAGE_CROWN,
    INDEX_ENGINE_CARRIAGE_EXTERIOR,
    clamped / 0.06,
  );
  if (clamped <= 0.16) return carriagePoseBetween(
    INDEX_ENGINE_CARRIAGE_EXTERIOR,
    INDEX_ENGINE_CARRIAGE_BASE,
    (clamped - 0.06) / 0.1,
  );
  if (clamped >= 0.94) return carriagePoseBetween(
    INDEX_ENGINE_CARRIAGE_APPROACH,
    INDEX_ENGINE_CARRIAGE_CROWN,
    (clamped - 0.94) / 0.06,
  );

  const climb = clampUnit((clamped - 0.16) / 0.74);
  const waypoints: readonly IndexEngineCarriagePose[] = [
    INDEX_ENGINE_CARRIAGE_BASE,
    { position: [0.68, 1.28, -0.55], rotation: [0, 0.28, 0] },
    { position: [0.68, 2.15, -0.55], rotation: [0, 0.28, 0] },
    { position: [0.68, 3.05, -0.55], rotation: [0, 0.28, 0] },
    INDEX_ENGINE_CARRIAGE_APPROACH,
  ];
  const scaled = climb * (waypoints.length - 1);
  const segment = Math.min(waypoints.length - 2, Math.floor(scaled));
  return carriagePoseBetween(waypoints[segment]!, waypoints[segment + 1]!, scaled - segment);
}

/** Idle-only carriage float; held ceremony poses stay fixed and reduced motion removes it entirely. */
export function indexEngineAmbientCarriageOffset(elapsedSeconds: number, reducedMotion: boolean): number {
  if (reducedMotion || !Number.isFinite(elapsedSeconds)) return 0;
  return Math.sin(elapsedSeconds * 1.6) * 0.03;
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
