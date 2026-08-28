export type ZoneId = 'work' | 'field-notes' | 'experiments' | 'hobbies' | 'about';
export type ContentStatus = 'complete' | 'in-progress' | 'maintained' | 'archived';
export type GridPoint = readonly [x: number, y: number, z: number];
export type QuarterTurn = 0 | 1 | 2 | 3;
export type CardinalDirection = 'north' | 'east' | 'south' | 'west';

export type ExperiencePhase =
  | 'explore'
  | 'travelling'
  | 'arriving'
  | 'opening-window'
  | 'zone-open'
  | 'entry-preview'
  | 'closing-window';

export type WindowContent =
  | { kind: 'index' }
  | { kind: 'zone'; zone: ZoneId }
  | { kind: 'entry'; zone: ZoneId; href: string };

export interface GridTransform {
  position: GridPoint;
  quarterTurns: QuarterTurn;
}

export interface WorldModule {
  id: string;
  kind: 'platform' | 'tower' | 'bridge' | 'stair' | 'water' | 'ruin' | 'turf';
  size: GridPoint;
  transform: GridTransform;
  stairNodeIds?: readonly [string, string];
  bridgeNodeIds?: readonly [string, string];
}

export interface WalkNode {
  id: string;
  position: GridPoint;
  surfaceId: string;
  zone?: ZoneId;
  neighbors: readonly string[];
  protectedEdges: readonly CardinalDirection[];
}

export interface WorldMap {
  spawnNodeId: string;
  modules: readonly WorldModule[];
  nodes: readonly WalkNode[];
}

export type ReactionKind =
  | 'bridge-sweep'
  | 'page-fins'
  | 'platform-lift'
  | 'carousel-spin'
  | 'beacon-ring';

export interface WorldReaction {
  zone: ZoneId;
  kind: ReactionKind;
  moduleIds: readonly string[];
  durationMs: number;
}

export interface WorldState {
  theme: 'day' | 'night';
  phase: ExperiencePhase;
  characterNodeId: string;
  path: readonly string[];
  targetZone: ZoneId | null;
  selectedZone: ZoneId | null;
  windowContent: WindowContent | null;
  announcement: string;
}
