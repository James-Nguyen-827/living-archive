import type {
  CardinalDirection,
  GridPoint,
  WalkNode,
  WorldMap,
  WorldModule,
  WorldReaction,
  ZoneId,
} from './world-types';

const ALL_EDGES: readonly CardinalDirection[] = ['north', 'east', 'south', 'west'];
const transform = (position: GridPoint, quarterTurns: 0 | 1 | 2 | 3 = 0): WorldModule['transform'] => ({
  position,
  quarterTurns,
});

const modules: WorldModule[] = [
  { id: 'central-platform', kind: 'platform', size: [5, 0.25, 5], transform: transform([0, 0, 0]) },
  { id: 'work-platform', kind: 'platform', size: [3, 0.25, 3], transform: transform([-7, -0.5, 0]) },
  { id: 'notes-platform', kind: 'platform', size: [3, 0.25, 3], transform: transform([0, 0.5, -8]) },
  { id: 'experiments-platform', kind: 'platform', size: [3, 0.25, 3], transform: transform([8, 0.5, 0]) },
  { id: 'hobbies-platform', kind: 'platform', size: [3, 0.25, 3], transform: transform([0, -0.5, 7]) },
  { id: 'about-platform', kind: 'platform', size: [3, 0.25, 3], transform: transform([7, 1, 8]) },
  { id: 'work-bridge', kind: 'bridge', size: [3, 0.25, 1], transform: transform([-4, -0.5, 0]), bridgeNodeIds: ['work-03', 'work-06'] },
  { id: 'experiments-bridge', kind: 'bridge', size: [3, 0.25, 1], transform: transform([5, 0.5, 0]), bridgeNodeIds: ['experiments-03', 'experiments-06'] },
  { id: 'hobbies-bridge', kind: 'bridge', size: [1, 0.25, 3], transform: transform([0, -0.5, 4]), bridgeNodeIds: ['hobbies-03', 'hobbies-06'] },
  { id: 'work-stair', kind: 'stair', size: [1, 0.75, 1], transform: transform([-3, 0, 0]), stairNodeIds: ['work-02', 'work-03'] },
  { id: 'hobbies-stair', kind: 'stair', size: [1, 0.75, 1], transform: transform([0, 0, 3]), stairNodeIds: ['hobbies-02', 'hobbies-03'] },
  { id: 'experiments-stair', kind: 'stair', size: [1, 0.75, 1], transform: transform([3, 0, 0]), stairNodeIds: ['experiments-02', 'experiments-03'] },
  { id: 'notes-stair', kind: 'stair', size: [1, 0.75, 1], transform: transform([0, 0, -3]), stairNodeIds: ['notes-02', 'notes-03'] },
  { id: 'notes-bridge', kind: 'bridge', size: [1, 0.25, 3], transform: transform([0, 0.5, -5]), bridgeNodeIds: ['notes-03', 'notes-06'] },
  { id: 'about-stair', kind: 'stair', size: [1, 0.75, 1], transform: transform([8, 0.5, 2]), stairNodeIds: ['about-01', 'about-02'] },
  { id: 'about-bridge', kind: 'bridge', size: [1, 0.25, 3], transform: transform([8, 1, 4]), bridgeNodeIds: ['about-02', 'about-05'] },
  { id: 'about-landing', kind: 'bridge', size: [1, 0.25, 1], transform: transform([8, 1, 6]), bridgeNodeIds: ['about-05', 'about-06'] },
  { id: 'work-tower', kind: 'tower', size: [1, 2.5, 1], transform: transform([-8, 0, -1]) },
  { id: 'notes-tower', kind: 'tower', size: [1, 4.5, 1], transform: transform([1, 1, -9]) },
  { id: 'about-tower', kind: 'tower', size: [1, 3.5, 1], transform: transform([7, 1.5, 8]) },
  { id: 'experiments-tower', kind: 'tower', size: [1, 3.5, 1], transform: transform([8, 1, -1]) },
  { id: 'central-ruin', kind: 'ruin', size: [1, 1, 1], transform: transform([-2, 0.5, -1]) },
  { id: 'work-ruin', kind: 'ruin', size: [1, 1, 1], transform: transform([-6, 0, 1]) },
  { id: 'notes-ruin', kind: 'ruin', size: [1, 1, 1], transform: transform([-1, 1, -9]) },
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
  'work',
  [[-1, 0, 0], [-2, 0, 0], [-3, -0.5, 0], [-4, -0.5, 0], [-5, -0.5, 0], [-6, -0.5, 0], [-7, -0.5, 0]],
  ['central-platform', 'central-platform', 'work-stair', 'work-bridge', 'work-bridge', 'work-platform', 'work-platform'],
  'work',
);
defineBranch(
  'notes',
  [[0, 0, -1], [0, 0, -2], [0, 0.5, -3], [0, 0.5, -4], [0, 0.5, -5], [0, 0.5, -6], [0, 0.5, -7], [0, 0.5, -8]],
  ['central-platform', 'central-platform', 'notes-stair', 'notes-bridge', 'notes-bridge', 'notes-bridge', 'notes-platform'],
  'field-notes',
);
const experimentsZone = defineBranch(
  'experiments',
  [[1, 0, 0], [2, 0, 0], [3, 0.5, 0], [4, 0.5, 0], [5, 0.5, 0], [6, 0.5, 0], [7, 0.5, 0], [8, 0.5, 0]],
  ['central-platform', 'central-platform', 'experiments-stair', 'experiments-bridge', 'experiments-bridge', 'experiments-bridge', 'experiments-platform', 'experiments-platform'],
  'experiments',
);
// Rounds the platform to its east tile: the centred carousel keeps the middle, and the
// traveler still parks on the camera-facing side rather than behind the canopy.
defineBranch(
  'hobbies',
  [[0, 0, 1], [0, 0, 2], [0, -0.5, 3], [0, -0.5, 4], [0, -0.5, 5], [0, -0.5, 6], [1, -0.5, 6], [1, -0.5, 7]],
  ['central-platform', 'central-platform', 'hobbies-stair', 'hobbies-bridge', 'hobbies-bridge', 'hobbies-platform'],
  'hobbies',
);

const aboutPoints: readonly GridPoint[] = [
  [8, 0.5, 1], [8, 1, 2], [8, 1, 3], [8, 1, 4],
  [8, 1, 5], [8, 1, 6], [8, 1, 7], [8, 1, 8],
];
let aboutPrevious = experimentsZone;
aboutPoints.forEach((point, index) => {
  const id = index === aboutPoints.length - 1 ? 'about-zone' : `about-${String(index + 1).padStart(2, '0')}`;
  const surfaceId = index === 0 ? 'experiments-platform' : index === 1 ? 'about-stair' : index <= 4 ? 'about-bridge' : index === 5 ? 'about-landing' : 'about-platform';
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
  work: 'work-zone',
  'field-notes': 'notes-zone',
  experiments: 'experiments-zone',
  hobbies: 'hobbies-zone',
  about: 'about-zone',
};

export const WORLD_REACTIONS: readonly WorldReaction[] = [
  { zone: 'work', kind: 'bridge-sweep', moduleIds: ['work-bridge', 'work-tower'], durationMs: 1_050 },
  { zone: 'field-notes', kind: 'page-riffle', moduleIds: ['notes-tower'], durationMs: 1_050 },
  { zone: 'experiments', kind: 'gate-slot', moduleIds: ['experiments-platform', 'experiments-tower'], durationMs: 1_050 },
  { zone: 'hobbies', kind: 'carousel-spin', moduleIds: ['hobbies-carousel'], durationMs: 620 },
  { zone: 'about', kind: 'lantern-rings', moduleIds: ['about-tower'], durationMs: 1_050 },
];

export const WORLD_MAP: WorldMap = { spawnNodeId: 'spawn', modules, nodes };
