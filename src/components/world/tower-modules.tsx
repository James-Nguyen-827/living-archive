import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
} from 'three';
import {
  buildRuinMeshes,
  mergedWindowParts,
  towerArchetypeFromModuleId,
  towerDesign,
  type TonedPart,
  type TowerAssembly,
} from './tower-designs';
import {
  AnimatedLambert,
  DECOR_GROUND_SNAP,
  TOWER_WINDOW,
  TOWER_WINDOW_DAY_COLOR,
  TOWER_WINDOW_NIGHT_COLOR,
  useNightMix,
  type WorldTheme,
} from './world-materials';
import {
  advanceTowerReaction,
  orreryBeamPose,
  orreryRingPose,
  pageBreathYaw,
  pagewellBookmarkTilt,
  pagewellFolioYaw,
  paradoxCubePose,
  paradoxFrameIdleSpin,
  paradoxFramePose,
  PROJECT_COURT_REACTION_DURATIONS,
  projectCourtPose,
  towerWindowGlow,
  type TowerReactionDurations,
  type TowerReactionState,
} from './world-motion';
import type { WorldModule } from './world-types';

type TowerProps = {
  module: WorldModule;
  theme: WorldTheme;
  active: boolean;
  reducedMotion: boolean;
  reactionSequence: number;
};

function useTowerReaction(
  active: boolean,
  reactionSequence: number,
  reducedMotion: boolean,
  durations?: TowerReactionDurations,
) {
  const state = useRef<TowerReactionState>({
    progress: active ? 1 : 0,
    sequence: reactionSequence,
  });
  const { invalidate } = useThree();

  useEffect(() => {
    if (reducedMotion) {
      state.current = { progress: active ? 1 : 0, sequence: reactionSequence };
    }
    invalidate();
  }, [active, invalidate, reactionSequence, reducedMotion]);

  useFrame((_frame, delta) => {
    state.current = advanceTowerReaction(
      state.current,
      delta,
      active,
      reactionSequence,
      reducedMotion,
      durations,
    );
    const target = active ? 1 : 0;
    if (Math.abs(state.current.progress - target) > 0.0001) invalidate();
  });

  return state;
}

function MergedParts({ parts, theme, reducedMotion }: {
  parts: readonly TonedPart[];
  theme: WorldTheme;
  reducedMotion: boolean;
}) {
  const meshes = useMemo(() => buildRuinMeshes(parts), [parts]);
  return meshes.map(({ tone, geometry }) => (
    <mesh key={tone} geometry={geometry} castShadow receiveShadow>
      <AnimatedLambert tone={tone} theme={theme} reducedMotion={reducedMotion} />
    </mesh>
  ));
}

function TowerWindows({
  parts,
  theme,
  active,
  reducedMotion,
}: {
  parts: ReturnType<typeof towerDesign>['windows'];
  theme: WorldTheme;
  active: boolean;
  reducedMotion: boolean;
}) {
  const geometry = useMemo(() => mergedWindowParts(parts), [parts]);
  const windows = useRef<Mesh>(null);
  const advanceNightMix = useNightMix(theme, reducedMotion);

  useFrame(({ clock }, delta) => {
    if (!windows.current) return;
    const nightMix = advanceNightMix(delta);
    const material = windows.current.material as MeshBasicMaterial;
    material.color.lerpColors(TOWER_WINDOW_DAY_COLOR, TOWER_WINDOW_NIGHT_COLOR, nightMix);
    material.opacity = MathUtils.lerp(
      towerWindowGlow(clock.elapsedTime, false, active, reducedMotion || active),
      towerWindowGlow(clock.elapsedTime, true, active, reducedMotion || active),
      nightMix,
    );
  });

  return (
    <mesh ref={windows} geometry={geometry}>
      <meshBasicMaterial
        color={theme === 'night' ? TOWER_WINDOW.night : TOWER_WINDOW.day}
        transparent
        opacity={towerWindowGlow(0, theme === 'night', active, true)}
        depthWrite={false}
      />
    </mesh>
  );
}

function TowerPlacement({ module, children }: { module: WorldModule; children: ReactNode }) {
  return (
    <group
      position={[
        module.transform.position[0],
        module.transform.position[1] - DECOR_GROUND_SNAP,
        module.transform.position[2],
      ]}
      rotation={[0, module.transform.quarterTurns * Math.PI / 2, 0]}
    >
      {children}
    </group>
  );
}

function assembly(design: ReturnType<typeof towerDesign>, key: string): TowerAssembly {
  const value = design.assemblies[key];
  if (!value) throw new Error(`Tower design is missing the ${key} assembly.`);
  return value;
}

function ProjectCourtTower({ module, theme, active, reducedMotion, reactionSequence }: TowerProps) {
  const height = module.size[1];
  const design = useMemo(() => towerDesign('project-court', height), [height]);
  const reaction = useTowerReaction(
    active,
    reactionSequence,
    reducedMotion,
    PROJECT_COURT_REACTION_DURATIONS,
  );
  const rearSlab = useRef<Group>(null);
  const frontSlab = useRef<Group>(null);
  const coralGantry = useRef<Group>(null);
  const rearSlabAssembly = assembly(design, 'rear-slab');
  const frontSlabAssembly = assembly(design, 'front-slab');
  const coralGantryAssembly = assembly(design, 'coral-gantry');

  useFrame(() => {
    const progress = reaction.current.progress;
    const pose = projectCourtPose(progress);
    if (rearSlab.current) {
      rearSlab.current.rotation.y = pose.rearSlabYaw;
      rearSlab.current.position.y = rearSlabAssembly.position[1] + pose.rearSlabLift;
    }
    if (frontSlab.current) {
      frontSlab.current.rotation.y = pose.frontSlabYaw;
      frontSlab.current.position.y = frontSlabAssembly.position[1] + pose.frontSlabLift;
    }
    if (coralGantry.current) {
      coralGantry.current.position.set(...pose.gantryPosition);
      coralGantry.current.rotation.set(0, pose.gantryYaw, 0);
      coralGantry.current.scale.set(1, 1, pose.gantryScaleZ);
    }
  });

  return (
    <TowerPlacement module={module}>
      <MergedParts parts={design.staticParts} theme={theme} reducedMotion={reducedMotion} />
      <group
        ref={rearSlab}
        position={rearSlabAssembly.position}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <MergedParts parts={rearSlabAssembly.parts} theme={theme} reducedMotion={reducedMotion} />
      </group>
      <group ref={frontSlab} position={frontSlabAssembly.position}>
        <MergedParts parts={frontSlabAssembly.parts} theme={theme} reducedMotion={reducedMotion} />
      </group>
      <group
        ref={coralGantry}
        position={[-0.54, 2.2, -0.74]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[1, 1, 0.22]}
      >
        <MergedParts parts={coralGantryAssembly.parts} theme={theme} reducedMotion={reducedMotion} />
      </group>
      <TowerWindows parts={design.windows} theme={theme} active={active} reducedMotion={reducedMotion} />
    </TowerPlacement>
  );
}

function PagewellTower({ module, theme, active, reducedMotion, reactionSequence }: TowerProps) {
  const height = module.size[1];
  const design = useMemo(() => towerDesign('pagewell', height), [height]);
  const reaction = useTowerReaction(active, reactionSequence, reducedMotion);
  const folios = useRef<InstancedMesh>(null);
  const bookmark = useRef<Group>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const folioAssemblies = useMemo(
    () => Array.from({ length: 5 }, (_unused, index) => assembly(design, `folio-${index}`)),
    [design],
  );
  const folioGeometry = useMemo(
    () => buildRuinMeshes(folioAssemblies[0]!.parts)[0]!.geometry,
    [folioAssemblies],
  );
  const bookmarkAssembly = assembly(design, 'bookmark');

  useFrame(({ clock }) => {
    const progress = reaction.current.progress;
    if (folios.current) {
      folioAssemblies.forEach((folio, index) => {
        const ambient = pageBreathYaw(clock.elapsedTime, index, folioAssemblies.length, reducedMotion)
          * (1 - progress);
        dummy.position.set(...folio.position);
        dummy.rotation.set(0, pagewellFolioYaw(progress, index) + ambient, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        folios.current!.setMatrixAt(index, dummy.matrix);
      });
      folios.current.instanceMatrix.needsUpdate = true;
    }
    if (bookmark.current) bookmark.current.rotation.z = pagewellBookmarkTilt(progress);
  });

  return (
    <TowerPlacement module={module}>
      <MergedParts parts={design.staticParts} theme={theme} reducedMotion={reducedMotion} />
      <instancedMesh
        ref={folios}
        args={[folioGeometry, undefined, folioAssemblies.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <AnimatedLambert tone="structure" theme={theme} />
      </instancedMesh>
      <group ref={bookmark} position={bookmarkAssembly.position}>
        <MergedParts parts={bookmarkAssembly.parts} theme={theme} reducedMotion={reducedMotion} />
      </group>
      <TowerWindows parts={design.windows} theme={theme} active={active} reducedMotion={reducedMotion} />
    </TowerPlacement>
  );
}

function ParadoxGateTower({ module, theme, active, reducedMotion, reactionSequence }: TowerProps) {
  const height = module.size[1];
  const design = useMemo(() => towerDesign('paradox-gate', height), [height]);
  const reaction = useTowerReaction(active, reactionSequence, reducedMotion);
  const frames = useRef<InstancedMesh>(null);
  const cube = useRef<Group>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const frameAssemblies = useMemo(
    () => Array.from({ length: 3 }, (_unused, index) => assembly(design, `frame-${index}`)),
    [design],
  );
  const frameGeometry = useMemo(
    () => buildRuinMeshes(frameAssemblies[0]!.parts)[0]!.geometry,
    [frameAssemblies],
  );
  const cubeAssembly = assembly(design, 'cube');
  const apertureY = frameAssemblies[0]!.position[1];

  useFrame(({ clock }) => {
    const progress = reaction.current.progress;
    if (frames.current) {
      frameAssemblies.forEach((frame, index) => {
        const pose = paradoxFramePose(progress, index);
        const idle = 1 - progress;
        const spin = paradoxFrameIdleSpin(clock.elapsedTime, index, reducedMotion);
        dummy.position.set(...frame.position);
        dummy.rotation.set(
          0,
          pose.rotationY + spin.rotationY * idle,
          pose.rotationZ + spin.rotationZ * idle,
        );
        dummy.scale.set(...(frame.scale ?? [1, 1, 1]));
        dummy.updateMatrix();
        frames.current!.setMatrixAt(index, dummy.matrix);
      });
      frames.current.instanceMatrix.needsUpdate = true;
    }
    if (cube.current) {
      const pose = paradoxCubePose(progress, cubeAssembly.position[1], apertureY);
      const idle = 1 - progress;
      cube.current.position.set(
        pose.x,
        pose.y + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.85) * 0.06 * idle),
        pose.z,
      );
      cube.current.rotation.y = pose.rotationY + (reducedMotion ? 0 : clock.elapsedTime * 0.12 * idle);
    }
  });

  return (
    <TowerPlacement module={module}>
      <MergedParts parts={design.staticParts} theme={theme} reducedMotion={reducedMotion} />
      <instancedMesh
        ref={frames}
        args={[frameGeometry, undefined, frameAssemblies.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <AnimatedLambert tone="olive" theme={theme} />
      </instancedMesh>
      <group ref={cube} position={cubeAssembly.position}>
        <MergedParts parts={cubeAssembly.parts} theme={theme} reducedMotion={reducedMotion} />
      </group>
      <TowerWindows parts={design.windows} theme={theme} active={active} reducedMotion={reducedMotion} />
    </TowerPlacement>
  );
}

function OrreryBeaconTower({ module, theme, active, reducedMotion, reactionSequence }: TowerProps) {
  const height = module.size[1];
  const design = useMemo(() => towerDesign('orrery', height), [height]);
  const reaction = useTowerReaction(active, reactionSequence, reducedMotion);
  const rings = useRef<(Group | null)[]>([]);
  const beamPivot = useRef<Group>(null);
  const beam = useRef<Mesh>(null);
  const ringAssemblies = useMemo(
    () => Array.from({ length: 3 }, (_unused, index) => assembly(design, `ring-${index}`)),
    [design],
  );
  const ringMeshes = useMemo(
    () => ringAssemblies.map((ring) => buildRuinMeshes(ring.parts)[0]!),
    [ringAssemblies],
  );
  const advanceBeamNightMix = useNightMix(theme, reducedMotion);
  const inwardYaw = useMemo(() => (
    Math.atan2(module.transform.position[0], module.transform.position[2])
    - module.transform.quarterTurns * Math.PI / 2
  ), [module.transform.position, module.transform.quarterTurns]);

  useFrame(({ clock }, delta) => {
    const progress = reaction.current.progress;
    rings.current.forEach((ring, index) => {
      if (!ring) return;
      const pose = orreryRingPose(progress, index, clock.elapsedTime * 0.08);
      ring.rotation.set(pose.rotationX, pose.rotationY, pose.rotationZ);
    });
    const beamPose = orreryBeamPose(progress, inwardYaw);
    if (beamPivot.current) beamPivot.current.rotation.y = beamPose.yaw;
    if (beam.current) {
      const nightMix = advanceBeamNightMix(delta);
      const material = beam.current.material as MeshBasicMaterial;
      material.color.lerpColors(TOWER_WINDOW_DAY_COLOR, TOWER_WINDOW_NIGHT_COLOR, nightMix);
      material.opacity = beamPose.opacity * MathUtils.lerp(0.62, 1, nightMix);
      beam.current.visible = material.opacity > 0.001;
    }
  });

  return (
    <TowerPlacement module={module}>
      <MergedParts parts={design.staticParts} theme={theme} reducedMotion={reducedMotion} />
      {ringAssemblies.map((ring, index) => (
        <group
          key={index}
          ref={(node) => { rings.current[index] = node; }}
          position={ring.position}
        >
          <mesh geometry={ringMeshes[index]!.geometry} castShadow>
            <AnimatedLambert tone="sun" theme={theme} />
          </mesh>
        </group>
      ))}
      <group ref={beamPivot} position={ringAssemblies[0]!.position}>
        <mesh ref={beam} position={[0, 0, -1.3]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
          <cylinderGeometry args={[0.035, 0.22, 2.6, 6, 1, true]} />
          <meshBasicMaterial
            color={theme === 'night' ? TOWER_WINDOW.night : TOWER_WINDOW.day}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      </group>
      <TowerWindows parts={design.windows} theme={theme} active={active} reducedMotion={reducedMotion} />
    </TowerPlacement>
  );
}

export function TowerModule({ module, theme, active, reducedMotion, reactionSequence }: TowerProps) {
  const archetype = towerArchetypeFromModuleId(module.id);
  switch (archetype) {
    case 'project-court': return <ProjectCourtTower module={module} theme={theme} active={active} reducedMotion={reducedMotion} reactionSequence={reactionSequence} />;
    case 'pagewell': return <PagewellTower module={module} theme={theme} active={active} reducedMotion={reducedMotion} reactionSequence={reactionSequence} />;
    case 'paradox-gate': return <ParadoxGateTower module={module} theme={theme} active={active} reducedMotion={reducedMotion} reactionSequence={reactionSequence} />;
    case 'orrery': return <OrreryBeaconTower module={module} theme={theme} active={active} reducedMotion={reducedMotion} reactionSequence={reactionSequence} />;
  }
}
