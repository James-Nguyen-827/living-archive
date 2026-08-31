import type {
  CardinalDirection,
  GridPoint,
  QuarterTurn,
  WalkNode,
  WorldMap,
  WorldModule,
  WorldReaction,
  ZoneId,
} from './world-types';

const ALL_EDGES: readonly CardinalDirection[] = ['north', 'east', 'south', 'west'];
const transform = (
  position: GridPoint,
  quarterTurns: QuarterTurn = 0,
  yawRadians?: number,
): WorldModule['transform'] => (yawRadians === undefined
  ? { position, quarterTurns }
  : { position, quarterTurns, yawRadians });

const modules: WorldModule[] = [
  { id: 'central-platform', kind: 'platform', size: [5, 0.25, 5], transform: transform([0, 0, 0]) },
  { id: 'employment-platform', kind: 'platform', size: [3, 0.25, 3], transform: transform([-7, -0.5, 0]) },
  { id: 'writing-platform', kind: 'platform', size: [3, 0.25, 3], transform: transform([0, 0.5, -8]) },
  { id: 'projects-platform', kind: 'platform', size: [3, 0.25, 3], transform: transform([8, 0.5, 0]) },
  { id: 'interests-platform', kind: 'platform', size: [3, 0.25, 3], transform: transform([0, -0.5, 7]) },
  { id: 'about-platform', kind: 'platform', size: [3, 0.25, 3], transform: transform([7, 1, 8]) },
  { id: 'employment-bridge', kind: 'bridge', size: [3, 0.25, 1], transform: transform([-4, -0.5, 0]), bridgeNodeIds: ['employment-03', 'employment-06'] },
  { id: 'projects-bridge', kind: 'bridge', size: [3, 0.25, 1], transform: transform([5, 0.5, 0]), bridgeNodeIds: ['projects-03', 'projects-06'] },
  { id: 'interests-bridge', kind: 'bridge', size: [1, 0.25, 3], transform: transform([0, -0.5, 4]), bridgeNodeIds: ['interests-03', 'interests-06'] },
  { id: 'employment-stair', kind: 'stair', size: [1, 0.75, 1], transform: transform([-3, 0, 0]), stairNodeIds: ['employment-02', 'employment-03'] },
  { id: 'interests-stair', kind: 'stair', size: [1, 0.75, 1], transform: transform([0, 0, 3]), stairNodeIds: ['interests-02', 'interests-03'] },
  { id: 'projects-stair', kind: 'stair', size: [1, 0.75, 1], transform: transform([3, 0, 0]), stairNodeIds: ['projects-02', 'projects-03'] },
  { id: 'writing-stair', kind: 'stair', size: [1, 0.75, 1], transform: transform([0, 0, -3]), stairNodeIds: ['writing-02', 'writing-03'] },
  { id: 'writing-bridge', kind: 'bridge', size: [1, 0.25, 3], transform: transform([0, 0.5, -5]), bridgeNodeIds: ['writing-03', 'writing-06'] },
  { id: 'about-stair', kind: 'stair', size: [1, 0.75, 1], transform: transform([8, 0.5, 2]), stairNodeIds: ['about-01', 'about-02'] },
  { id: 'about-bridge', kind: 'bridge', size: [1, 0.25, 3], transform: transform([8, 1, 4]), bridgeNodeIds: ['about-02', 'about-05'] },
  { id: 'about-landing', kind: 'bridge', size: [1, 0.25, 1], transform: transform([8, 1, 6]), bridgeNodeIds: ['about-05', 'about-06'] },
  { id: 'employment-tower', kind: 'tower', size: [1, 2.5, 1], transform: transform([-7, 0, 0], 1) },
  { id: 'writing-tower', kind: 'tower', size: [1, 4.5, 1], transform: transform([0, 1, -8], 0, -3 * Math.PI / 4) },
  { id: 'about-tower', kind: 'tower', size: [1, 3.5, 1], transform: transform([7, 1.5, 8]) },
  { id: 'projects-tower', kind: 'tower', size: [1, 3.5, 1], transform: transform([8, 1, -1]) },
  { id: 'central-ruin', kind: 'ruin', size: [1, 1, 1], transform: transform([-2, 0.5, -1]) },
  { id: 'about-ruin', kind: 'ruin', size: [1, 1, 1], transform: transform([6, 1, 8]) },
];

const nodeDefinitions = new Map<string, Omit<WalkNode, 'neighbors' | 'protectedEdges'>>();
const neighbors = new Map<string, string[]>();

function defineNode(id: string, position: GridPoint, surfaceId: string, zone?: ZoneId): void {
  nodeDefinitions.set(id, { id, position, surfaceId, zone });
  neighbors.set(id, []);
}

function connect(firstId: string, secondId: string): void {
  neighbors.get(firstId)!.push(secondId);
  neighbors.get(secondId)!.push(firstId);
}

defineNode('spawn', [0, 0, 0], 'central-platform');

function defineBranch(prefix: string, points: readonly GridPoint[], surfaceIds: readonly string[], zone: ZoneId): string {
  let previous = 'spawn';
  points.forEach((point, index) => {
    const id = index === points.length - 1 ? `${prefix}-zone` : `${prefix}-${String(index + 1).padStart(2, '0')}`;
    defineNode(id, point, surfaceIds[Math.min(index, surfaceIds.length - 1)], index === points.length - 1 ? zone : undefined);
    connect(previous, id);
    previous = id;
  });
  return previous;
}

defineBranch(
  'employment',
  [[-1, 0, 0], [-2, 0, 0], [-3, -0.5, 0], [-4, -0.5, 0], [-5, -0.5, 0], [-6, -0.5, 0], [-7, -0.5, 0]],
  ['central-platform', 'central-platform', 'employment-stair', 'employment-bridge', 'employment-bridge', 'employment-platform', 'employment-platform'],
  'employment',
);
defineBranch(
  'writing',
  [[0, 0, -1], [0, 0, -2], [0, 0.5, -3], [0, 0.5, -4], [0, 0.5, -5], [0, 0.5, -6], [0, 0.5, -7], [1, 0.5, -7]],
  ['central-platform', 'central-platform', 'writing-stair', 'writing-bridge', 'writing-bridge', 'writing-bridge', 'writing-platform'],
  'writing',
);
const projectsZone = defineBranch(
  'projects',
  [[1, 0, 0], [2, 0, 0], [3, 0.5, 0], [4, 0.5, 0], [5, 0.5, 0], [6, 0.5, 0], [7, 0.5, 0], [8, 0.5, 0]],
  ['central-platform', 'central-platform', 'projects-stair', 'projects-bridge', 'projects-bridge', 'projects-bridge', 'projects-platform', 'projects-platform'],
  'projects',
);
// Rounds the platform to its east tile: the centred carousel keeps the middle, and the
// traveler still parks on the camera-facing side rather than behind the canopy.
defineBranch(
  'interests',
  [[0, 0, 1], [0, 0, 2], [0, -0.5, 3], [0, -0.5, 4], [0, -0.5, 5], [0, -0.5, 6], [1, -0.5, 6], [1, -0.5, 7]],
  ['central-platform', 'central-platform', 'interests-stair', 'interests-bridge', 'interests-bridge', 'interests-platform'],
  'interests',
);

const aboutPoints: readonly GridPoint[] = [
  [8, 0.5, 1], [8, 1, 2], [8, 1, 3], [8, 1, 4],
  [8, 1, 5], [8, 1, 6], [8, 1, 7], [8, 1, 8],
];
let aboutPrevious = projectsZone;
aboutPoints.forEach((point, index) => {
  const id = index === aboutPoints.length - 1 ? 'about-zone' : `about-${String(index + 1).padStart(2, '0')}`;
  const surfaceId = index === 0 ? 'projects-platform' : index === 1 ? 'about-stair' : index <= 4 ? 'about-bridge' : index === 5 ? 'about-landing' : 'about-platform';
  defineNode(id, point, surfaceId, index === aboutPoints.length - 1 ? 'about' : undefined);
  connect(aboutPrevious, id);
  aboutPrevious = id;
});

function direction(from: GridPoint, to: GridPoint): CardinalDirection {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  if (dx === 1) return 'east';
  if (dx === -1) return 'west';
  if (dz === 1) return 'south';
  return 'north';
}

const nodes: WalkNode[] = [...nodeDefinitions.values()].map((node) => {
  const nodeNeighbors = neighbors.get(node.id)!;
  const connected = new Set(nodeNeighbors.map((id) => direction(node.position, nodeDefinitions.get(id)!.position)));
  return {
    ...node,
    neighbors: nodeNeighbors,
    protectedEdges: ALL_EDGES.filter((edge) => !connected.has(edge)),
  };
});

export const ZONE_NODES: Record<ZoneId, string> = {
  employment: 'employment-zone',
  writing: 'writing-zone',
  projects: 'projects-zone',
  interests: 'interests-zone',
  about: 'about-zone',
};

export const WORLD_REACTIONS: readonly WorldReaction[] = [
  { zone: 'employment', kind: 'bridge-sweep', moduleIds: ['employment-bridge', 'employment-tower'], durationMs: 1_050 },
  { zone: 'writing', kind: 'index-sequence', moduleIds: ['writing-tower'], durationMs: 1_400 },
  { zone: 'projects', kind: 'gate-slot', moduleIds: ['projects-platform', 'projects-tower'], durationMs: 1_050 },
  { zone: 'interests', kind: 'carousel-spin', moduleIds: ['interests-carousel'], durationMs: 620 },
  { zone: 'about', kind: 'lantern-rings', moduleIds: ['about-tower'], durationMs: 1_050 },
];

export const WORLD_MAP: WorldMap = { spawnNodeId: 'spawn', modules, nodes };
