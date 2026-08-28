import type { CardinalDirection, GridPoint, WorldMap } from './world-types';

export interface ValidationIssue { code: string; detail: string }
const DIRECTIONS: readonly CardinalDirection[] = ['north', 'east', 'south', 'west'];
const ZONES = ['work', 'field-notes', 'experiments', 'hobbies', 'about'] as const;

const isGridPosition = (point: GridPoint) =>
  Number.isInteger(point[0]) && Number.isInteger(point[1] * 2) && Number.isInteger(point[2]);
const isModuleSize = (point: GridPoint) => point.every((dimension) => dimension > 0 && Number.isInteger(dimension * 4));

function rotatedSize(size: GridPoint, quarterTurns: number): GridPoint {
  return Math.abs(quarterTurns) % 2 === 1 ? [size[2], size[1], size[0]] : size;
}

function overlaps(first: { position: GridPoint; size: GridPoint }, second: { position: GridPoint; size: GridPoint }): boolean {
  const horizontal = (axis: 0 | 2) =>
    Math.abs(first.position[axis] - second.position[axis]) < (first.size[axis] + second.size[axis]) / 2;
  const firstTop = first.position[1] + first.size[1];
  const secondTop = second.position[1] + second.size[1];
  return horizontal(0) && horizontal(2) && first.position[1] < secondTop && second.position[1] < firstTop;
}

function edgeDirection(from: GridPoint, to: GridPoint): CardinalDirection | null {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  if (dx === 1 && dz === 0) return 'east';
  if (dx === -1 && dz === 0) return 'west';
  if (dx === 0 && dz === 1) return 'south';
  if (dx === 0 && dz === -1) return 'north';
  return null;
}

export function validateWorld(world: WorldMap): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodes = new Map(world.nodes.map((node) => [node.id, node]));
  const modules = new Map(world.modules.map((module) => [module.id, module]));
  const allIds = [...world.modules.map((module) => module.id), ...world.nodes.map((node) => node.id)];

  for (const id of new Set(allIds)) {
    if (allIds.filter((candidate) => candidate === id).length > 1) {
      issues.push({ code: 'duplicate-id', detail: `${id} is used more than once.` });
    }
  }

  for (const module of world.modules) {
    if (!isGridPosition(module.transform.position)) {
      issues.push({ code: 'fractional-grid', detail: `${module.id} is off-grid.` });
    }
    if (!Number.isInteger(module.transform.quarterTurns) || module.transform.quarterTurns < 0 || module.transform.quarterTurns > 3) {
      issues.push({ code: 'unsupported-rotation', detail: `${module.id} has an invalid rotation.` });
    }
    if (!isModuleSize(module.size)) {
      issues.push({ code: 'invalid-size', detail: `${module.id} must use positive quarter-unit dimensions.` });
    }

    if (module.kind === 'stair') {
      const [startId, endId] = module.stairNodeIds ?? [];
      const start = startId ? nodes.get(startId) : undefined;
      const end = endId ? nodes.get(endId) : undefined;
      const horizontalRun = start && end
        ? Math.abs(start.position[0] - end.position[0]) + Math.abs(start.position[2] - end.position[2])
        : -1;
      const rise = start && end ? Math.abs(start.position[1] - end.position[1]) : -1;
      if (!start || !end || horizontalRun !== 1 || rise !== 0.5) {
        issues.push({ code: 'invalid-stair', detail: `${module.id} must rise 0.5 units over one grid unit.` });
      }
    }

    if (module.kind === 'bridge') {
      const [startId, endId] = module.bridgeNodeIds ?? [];
      const start = startId ? nodes.get(startId) : undefined;
      const end = endId ? nodes.get(endId) : undefined;
      if (!start || !end) {
        issues.push({ code: 'bridge-endpoint', detail: `${module.id} has missing bridge endpoints.` });
      } else {
        const size = rotatedSize(module.size, module.transform.quarterTurns);
        const runsAlongX = size[0] > size[2];
        const aligned = runsAlongX
          ? start.position[2] === end.position[2] && module.transform.position[2] === start.position[2]
          : start.position[0] === end.position[0] && module.transform.position[0] === start.position[0];
        const level = start.position[1] === end.position[1] && module.transform.position[1] === start.position[1];
        const span = Math.max(size[0], size[2]);
        const endpointSpan = Math.max(
          Math.abs(start.position[0] - end.position[0]),
          Math.abs(start.position[2] - end.position[2]),
        );
        const midpoint = runsAlongX
          ? (start.position[0] + end.position[0]) / 2
          : (start.position[2] + end.position[2]) / 2;
        const center = runsAlongX ? module.transform.position[0] : module.transform.position[2];
        if (!aligned || !level || Math.abs(span - endpointSpan) > 1 || Math.abs(center - midpoint) > 0.5) {
          issues.push({ code: 'bridge-endpoint', detail: `${module.id} does not align with its endpoints.` });
        }
      }
    }
  }

  const solids = world.modules.filter((module) => ['platform', 'tower', 'bridge', 'stair'].includes(module.kind));
  for (let firstIndex = 0; firstIndex < solids.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < solids.length; secondIndex += 1) {
      const first = solids[firstIndex];
      const second = solids[secondIndex];
      if (overlaps(
        { position: first.transform.position, size: rotatedSize(first.size, first.transform.quarterTurns) },
        { position: second.transform.position, size: rotatedSize(second.size, second.transform.quarterTurns) },
      )) {
        issues.push({ code: 'overlap', detail: `${first.id} and ${second.id} overlap.` });
      }
    }
  }

  for (const node of world.nodes) {
    if (!isGridPosition(node.position)) issues.push({ code: 'fractional-grid', detail: `${node.id} is off-grid.` });
    const surface = modules.get(node.surfaceId);
    if (!surface) issues.push({ code: 'missing-surface', detail: `${node.id} references missing surface ${node.surfaceId}.` });
    const protectedEdges = new Set(node.protectedEdges ?? []);
    const connectedDirections = new Set<CardinalDirection>();

    for (const neighborId of node.neighbors ?? []) {
      const neighbor = nodes.get(neighborId);
      if (!neighbor) {
        issues.push({ code: 'missing-node', detail: `${node.id} references missing node ${neighborId}.` });
        continue;
      }
      if (!neighbor.neighbors?.includes(node.id)) {
        issues.push({ code: 'asymmetric-edge', detail: `${node.id} -> ${neighborId} is one-way.` });
        continue;
      }
      const horizontalRun = Math.abs(node.position[0] - neighbor.position[0]) + Math.abs(node.position[2] - neighbor.position[2]);
      const rise = Math.abs(node.position[1] - neighbor.position[1]);
      if (horizontalRun !== 1 || (rise !== 0 && rise !== 0.5)) {
        issues.push({ code: 'invalid-walk-edge', detail: `${node.id} -> ${neighborId} skips the authored grid.` });
      }
      const direction = edgeDirection(node.position, neighbor.position);
      if (direction) connectedDirections.add(direction);
    }

    for (const direction of DIRECTIONS) {
      if (!protectedEdges.has(direction) && !connectedDirections.has(direction)) {
        issues.push({ code: 'unprotected-edge', detail: `${node.id} exposes its ${direction} edge.` });
      }
    }

    if (surface) {
      if (!['platform', 'tower', 'bridge', 'stair'].includes(surface.kind)) {
        issues.push({ code: 'invalid-surface', detail: `${node.id} cannot use ${surface.kind} surface ${surface.id}.` });
      }
      const size = rotatedSize(surface.size, surface.transform.quarterTurns);
      const withinX = Math.abs(node.position[0] - surface.transform.position[0]) <= size[0] / 2 + 0.001;
      const withinZ = Math.abs(node.position[2] - surface.transform.position[2]) <= size[2] / 2 + 0.001;
      const atLevel = surface.kind === 'stair'
        ? surface.stairNodeIds?.includes(node.id) === true
        : node.position[1] === surface.transform.position[1];
      if (!withinX || !withinZ || !atLevel) {
        issues.push({ code: 'detached-node', detail: `${node.id} is not supported by ${surface.id}.` });
      }
    }
  }

  const reachable = new Set<string>([world.spawnNodeId]);
  const queue = [world.spawnNodeId];
  while (queue.length > 0) {
    const current = nodes.get(queue.shift()!);
    if (!current) continue;
    for (const neighborId of current.neighbors ?? []) {
      const neighbor = nodes.get(neighborId);
      if (!neighbor?.neighbors?.includes(current.id) || reachable.has(neighborId)) continue;
      reachable.add(neighborId);
      queue.push(neighborId);
    }
  }
  for (const zone of ZONES) {
    const zoneNode = world.nodes.find((node) => node.zone === zone);
    if (!zoneNode || !reachable.has(zoneNode.id)) {
      issues.push({ code: 'unreachable-zone', detail: `${zone} cannot be reached from the spawn node.` });
    }
  }
  return issues;
}
