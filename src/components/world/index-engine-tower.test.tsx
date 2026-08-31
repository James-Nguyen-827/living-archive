import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { towerDesign } from './tower-designs';
import {
  indexEngineChamberPose,
  indexEngineCrownHalfPose,
} from './world-motion';
import { WORLD_MAP } from './world-map';

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: () => ({ invalidate: vi.fn() }),
}));
vi.mock('./world-materials', async (importOriginal) => {
  const original = await importOriginal<typeof import('./world-materials')>();
  return {
    ...original,
    AnimatedLambert: () => <span data-testid="lambert-material" />,
    useNightMix: () => () => 0,
  };
});

import { TowerModule } from './tower-modules';

afterEach(cleanup);

describe('Index Engine tower renderer', () => {
  it('renders exactly two static tone meshes, two instanced keyed meshes, one carriage mesh, and one window mesh', () => {
    const module = WORLD_MAP.modules.find((candidate) => candidate.id === 'writing-tower')!;
    const design = towerDesign('index-engine', module.size[1]);
    const { container } = render(
      <TowerModule
        module={module}
        theme="day"
        active={false}
        reducedMotion={false}
        reactionSequence={0}
      />,
    );

    const instancedMeshes = container.querySelectorAll('instancedmesh');
    const meshes = container.querySelectorAll('mesh');
    const staticTones = new Set(design.staticParts.map((part) => part.tone));

    expect(instancedMeshes).toHaveLength(2);
    expect(meshes).toHaveLength(4);
    expect(staticTones).toEqual(new Set(['structure', 'surface']));
    expect(container.querySelector('[name="index-engine-chambers"]')).toBeInTheDocument();
    expect(container.querySelector('[name="index-engine-crown"]')).toBeInTheDocument();
    expect(container.querySelector('[name="index-engine-carriage"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid="lambert-material"]')).toHaveLength(5);
  });

  it('maps six authored keyed assemblies to neutral pose transforms', () => {
    const module = WORLD_MAP.modules.find((candidate) => candidate.id === 'writing-tower')!;
    const design = towerDesign('index-engine', module.size[1]);
    const transforms = [
      ...Array.from({ length: 4 }, (_unused, index) => ({
        key: `chamber-${index}`,
        assembly: design.assemblies[`chamber-${index}`]!,
        pose: indexEngineChamberPose(0, index),
      })),
      ...Array.from({ length: 2 }, (_unused, index) => ({
        key: `crown-half-${index}`,
        assembly: design.assemblies[`crown-half-${index}`]!,
        pose: indexEngineCrownHalfPose(0, index),
      })),
    ];

    expect(transforms).toHaveLength(6);
    expect(new Set(transforms.map(({ key }) => key))).toEqual(new Set([
      'chamber-0',
      'chamber-1',
      'chamber-2',
      'chamber-3',
      'crown-half-0',
      'crown-half-1',
    ]));
    expect(new Set(transforms.map(({ assembly }) => assembly.scale?.join(',')))).toHaveLength(5);
    transforms.forEach(({ assembly, pose, key }, index) => {
      expect(assembly.position, `assembly ${index} position`).toEqual(pose.position);
      expect(assembly.scale, `assembly ${index} scale`).toBeDefined();
      if (key.startsWith('chamber-')) {
        expect(assembly.parts).toEqual(design.assemblies['chamber-0']!.parts);
      } else {
        expect(assembly.parts).toEqual(design.assemblies['crown-half-0']!.parts);
      }
    });
  });
});
