import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BoxGeometry,
  Color,
  Matrix4,
  AmbientLight,
  DirectionalLight,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshLambertMaterial,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ProjectedLabel } from './label-layout';
import { zoneLabelAnchor } from './label-anchors';
import { getStairSteps } from './stair-geometry';
import { TowerModule } from './tower-modules';
import { buildRuinMeshes, type TonedPart } from './tower-designs';
import { AmbientMotionDriver } from './use-ambient-tick';
import {
  AnimatedLambert,
  DAY,
  DECOR_GROUND_SNAP,
  LANDING_PAD,
  LANDING_PAD_TILE,
  NIGHT,
  TOWER_WINDOW_DAY_COLOR,
  TOWER_WINDOW_NIGHT_COLOR,
  updateGoldRingLambert,
  updateLandingPadLambert,
  useNightMix,
  type PaletteKey,
  type WorldTheme,
} from './world-materials';
import {
  buildLandingPadPatternGeometry,
  buildLandingPadStructureGeometry,
} from './landing-pad-pattern';
import { WORLD_MAP, ZONE_NODES } from './world-map';
import {
  applyVegetationTheme,
  buildVegetationGeometry,
  deformVegetationGeometry,
} from './world-vegetation';
import {
  cameraReframeProgress,
  carouselBulbGlow,
  carouselSpinSpeed,
  CAROUSEL_IDLE_SPIN_SPEED,
  easeOutQuint,
  nearestEquivalentAngle,
  rotatePointY,
  themeTransitionProgress,
  towerWindowGlow,
} from './world-motion';
import type { ExperiencePhase, WorldModule, ZoneId } from './world-types';

export type LabelProjectionHandler = (labels: readonly ProjectedLabel[]) => void;

interface Props {
  rotationAngle: number;
  theme: WorldTheme;
  phase: ExperiencePhase;
  characterNodeId: string;
  path: readonly string[];
  targetZone: ZoneId | null;
  selectedZone: ZoneId | null;
  reactionSequence: number;
  reducedMotion: boolean;
  onZoneRequest: (zone: ZoneId) => void;
  onLabelsProject: LabelProjectionHandler;
}

const PLATFORM_PILLAR_DEPTH = 1.75;
const WORLD_PILLAR_BOTTOM = -2.25;
const WORLD_WATER_SIZE = 22;
const WORLD_WATER_HALF_EXTENT = WORLD_WATER_SIZE / 2;
const WORLD_WATER_LEVEL = -PLATFORM_PILLAR_DEPTH / 2;
const WORLD_WATER_THICKNESS = WORLD_WATER_LEVEL - WORLD_PILLAR_BOTTOM;
const WORLD_WATER_CENTER_Y = (WORLD_WATER_LEVEL + WORLD_PILLAR_BOTTOM) / 2;
const WORLD_SHADOW_PLANE_Y = WORLD_WATER_LEVEL - 0.02;
const CELESTIAL_RADIUS = 0.7;
const CAMERA_ORBIT_OFFSET = new Vector3(14, 14, 14);
const DEFAULT_HOME_FOCUS = new Vector3(0, 0, 0);
const DEFAULT_HOME_CAMERA_ZOOM = 37;
const CELESTIAL_BELOW_HORIZON_Y = -3.5;
const SUN_DAY_POSITION = new Vector3(5.5, 10.2, -6.5);
const SUN_SET_POSITION = new Vector3(5.5, CELESTIAL_BELOW_HORIZON_Y, -6.5);

function computeMoonPositionsFromSun(
  sunDay: Vector3,
  belowHorizonY: number,
  focus: Vector3,
  cameraOffset: Vector3,
  zoom: number,
): { night: Vector3; rise: Vector3 } {
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  camera.position.copy(focus).add(cameraOffset);
  camera.lookAt(focus);
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  const night = sunDay.clone().sub(focus);
  night.applyMatrix4(camera.matrixWorldInverse);
  night.x *= -1;
  night.applyMatrix4(camera.matrixWorld);
  night.add(focus);

  return { night, rise: new Vector3(night.x, belowHorizonY, night.z) };
}

const { night: MOON_NIGHT_POSITION, rise: MOON_RISE_POSITION } = computeMoonPositionsFromSun(
  SUN_DAY_POSITION,
  CELESTIAL_BELOW_HORIZON_Y,
  DEFAULT_HOME_FOCUS,
  CAMERA_ORBIT_OFFSET,
  DEFAULT_HOME_CAMERA_ZOOM,
);

function updateCelestialPositions(dusk: number, sun: Vector3, moon: Vector3, light: Vector3) {
  sun.copy(SUN_DAY_POSITION).lerp(SUN_SET_POSITION, dusk);
  moon.copy(MOON_RISE_POSITION).lerp(MOON_NIGHT_POSITION, dusk);
  light.copy(sun).multiplyScalar(1 - dusk).addScaledVector(moon, dusk);
}

function platformShaftLayout(module: WorldModule) {
  const slabHeight = module.size[1] / 2;
  const collarHeight = slabHeight;
  const mossHeight = slabHeight;
  const platformY = module.transform.position[1];
  const extension = Math.max(0, platformY + 0.5);
  const shaftHeight = collarHeight + PLATFORM_PILLAR_DEPTH + extension;
  const localBottom = WORLD_PILLAR_BOTTOM - platformY;
  const shaftCenterY = localBottom + shaftHeight / 2;
  return {
    mossHeight,
    mossCenterY: collarHeight + mossHeight / 2,
    shaftHeight,
    shaftCenterY,
    capWidth: module.size[0],
    capDepth: module.size[2],
  };
}

function PlatformBody({
  module,
  theme,
  mossRef,
  interactive,
  onSelect,
  onPointerOver,
  onPointerOut,
}: {
  module: WorldModule;
  theme: Props['theme'];
  mossRef?: React.RefObject<MeshLambertMaterial | null>;
  interactive?: boolean;
  onSelect?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}) {
  const { mossHeight, mossCenterY, shaftHeight, shaftCenterY, capWidth, capDepth } = platformShaftLayout(module);
  return (
    <>
      <mesh position={[0, shaftCenterY, 0]} receiveShadow>
        <boxGeometry args={[capWidth, shaftHeight, capDepth]} />
        <AnimatedLambert tone="dirt" theme={theme} />
      </mesh>
      <mesh
        position={[0, mossCenterY, 0]}
        castShadow
        receiveShadow
        onPointerOver={interactive ? (event) => { event.stopPropagation(); onPointerOver?.(); } : undefined}
        onPointerOut={interactive ? () => onPointerOut?.() : undefined}
        onClick={interactive ? (event) => { event.stopPropagation(); onSelect?.(); } : undefined}
      >
        <boxGeometry args={[capWidth, mossHeight, capDepth]} />
        {mossRef
          ? <meshLambertMaterial ref={mossRef} color={(theme === 'night' ? NIGHT : DAY).moss} flatShading />
          : <AnimatedLambert tone="moss" theme={theme} />}
      </mesh>
    </>
  );
}

function SceneLight({
  theme,
  reducedMotion,
  dusk,
}: Pick<Props, 'theme' | 'reducedMotion'> & { dusk: { current: number } }) {
  const light = useRef<DirectionalLight>(null);
  const ambient = useRef<AmbientLight>(null);
  const sunPosition = useRef(new Vector3());
  const moonPosition = useRef(new Vector3());
  const lightPosition = useRef(new Vector3());
  const progress = dusk;
  const from = useRef(progress.current);
  const elapsed = useRef(0.9);
  const target = theme === 'night' ? 1 : 0;
  const { invalidate } = useThree();
  useEffect(() => {
    from.current = progress.current;
    elapsed.current = 0;
    invalidate();
  }, [invalidate, progress, theme]);
  useFrame((_state, delta) => {
    if (reducedMotion) {
      progress.current = target;
      elapsed.current = 0.9;
    } else {
      elapsed.current += delta;
      progress.current = MathUtils.lerp(from.current, target, themeTransitionProgress(elapsed.current));
    }
    const value = progress.current;
    updateCelestialPositions(value, sunPosition.current, moonPosition.current, lightPosition.current);
    if (light.current) {
      light.current.position.copy(lightPosition.current);
      light.current.target.position.set(0, 0, 0);
      light.current.target.updateMatrixWorld();
      light.current.intensity = MathUtils.lerp(2.8, 1.85, value);
      light.current.color.lerpColors(new Color('#fff9df'), new Color('#b8c8e0'), value);
    }
    if (ambient.current) {
      ambient.current.intensity = MathUtils.lerp(1.5, 0.95, value);
      ambient.current.color.lerpColors(new Color('#ffffff'), new Color('#9eb4d0'), value);
    }
    if (elapsed.current < 0.9) invalidate();
  });
  return (
    <>
      <ambientLight ref={ambient} intensity={1.5} />
      <directionalLight
        ref={light}
        position={SUN_DAY_POSITION.toArray()}
        intensity={2.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-WORLD_WATER_HALF_EXTENT}
        shadow-camera-right={WORLD_WATER_HALF_EXTENT}
        shadow-camera-top={WORLD_WATER_HALF_EXTENT}
        shadow-camera-bottom={-WORLD_WATER_HALF_EXTENT}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-bias={-0.0002}
      >
        <object3D attach="target" position={[0, 0, 0]} />
      </directionalLight>
      <NightAmbience theme={theme} reducedMotion={reducedMotion} dusk={progress} />
    </>
  );
}

function CelestialBodies({ theme, dusk }: { theme: Props['theme']; dusk: { current: number } }) {
  const sun = useRef<Mesh>(null);
  const moon = useRef<Mesh>(null);
  const sunPosition = useRef(new Vector3());
  const moonPosition = useRef(new Vector3());
  const lightPosition = useRef(new Vector3());
  const { invalidate } = useThree();
  useFrame(() => {
    const value = dusk.current;
    updateCelestialPositions(value, sunPosition.current, moonPosition.current, lightPosition.current);
    if (sun.current) {
      sun.current.position.copy(sunPosition.current);
      const material = sun.current.material as MeshLambertMaterial;
      material.transparent = true;
      material.opacity = Math.max(0, 1 - value);
      sun.current.visible = material.opacity > 0.04;
    }
    if (moon.current) {
      moon.current.position.copy(moonPosition.current);
      const material = moon.current.material as MeshLambertMaterial;
      material.transparent = true;
      material.opacity = Math.max(0, value);
      moon.current.visible = material.opacity > 0.04;
    }
    if (value > 0 && value < 1) invalidate();
  });
  return (
    <>
      <mesh ref={sun} position={SUN_DAY_POSITION.toArray()}>
        <icosahedronGeometry args={[CELESTIAL_RADIUS, 1]} /><AnimatedLambert tone="sun" theme={theme} transparent opacity={1} />
      </mesh>
      <mesh ref={moon} position={MOON_RISE_POSITION.toArray()} visible={false}>
        <icosahedronGeometry args={[CELESTIAL_RADIUS, 1]} /><AnimatedLambert tone="moon" theme={theme} transparent opacity={0} />
      </mesh>
    </>
  );
}

function NightAmbience({
  theme,
}: {
  theme: Props['theme'];
  reducedMotion: boolean;
  dusk: { current: number };
}) {
  return (
    <>
      <pointLight position={[-8, 3.4, -1]} intensity={theme === 'night' ? 1.55 : 0} color="#ffb38a" distance={10} />
      <pointLight position={[1, 4.6, -9]} intensity={theme === 'night' ? 1.4 : 0} color="#d7ecff" distance={9} />
      <pointLight position={[7, 3.8, 8]} intensity={theme === 'night' ? 1.45 : 0} color="#ffc7a1" distance={10} />
    </>
  );
}

function CameraRig({ selectedZone, rotationAngle, reducedMotion }: Pick<Props, 'selectedZone' | 'rotationAngle' | 'reducedMotion'>) {
  const { camera, size } = useThree();
  const currentFocus = useRef(new Vector3());
  const zoomRef = useRef(size.width < 500 ? 20 : size.width < 900 ? 30 : 37);
  const transition = useRef<{
    from: Vector3; to: Vector3; fromZoom: number; toZoom: number; elapsed: number;
  } | null>(null);
  const destination = useMemo(() => {
    if (!selectedZone) return new Vector3();
    const node = WORLD_MAP.nodes.find((item) => item.id === ZONE_NODES[selectedZone]);
    if (!node) return new Vector3();
    const rotated = rotatePointY(node.position, rotationAngle);
    const verticalCompositionOffset = size.width < 500 ? 4.6 : 2.3;
    return new Vector3(rotated[0] + verticalCompositionOffset, rotated[1], rotated[2] + verticalCompositionOffset);
  }, [rotationAngle, selectedZone, size.width]);
  const targetZoom = useMemo(() => {
    const baseZoom = size.width < 500 ? 20 : size.width < 900 ? 30 : 37;
    return selectedZone ? baseZoom * 1.18 : baseZoom;
  }, [selectedZone, size.width]);

  useEffect(() => {
    transition.current = {
      from: currentFocus.current.clone(),
      to: destination.clone(),
      fromZoom: zoomRef.current,
      toZoom: targetZoom,
      elapsed: 0,
    };
  }, [destination, targetZoom]);

  useFrame((_state, delta) => {
    const orthographic = camera as OrthographicCamera;
    if (reducedMotion) {
      currentFocus.current.copy(destination);
      transition.current = null;
      orthographic.zoom = targetZoom;
      zoomRef.current = targetZoom;
    } else if (transition.current) {
      transition.current.elapsed += delta;
      const progress = cameraReframeProgress(transition.current.elapsed);
      currentFocus.current.lerpVectors(transition.current.from, transition.current.to, progress);
      orthographic.zoom = MathUtils.lerp(transition.current.fromZoom, transition.current.toZoom, progress);
      zoomRef.current = orthographic.zoom;
      if (progress >= 1) transition.current = null;
    } else {
      currentFocus.current.lerp(destination, 0.12);
      orthographic.zoom = MathUtils.damp(orthographic.zoom, targetZoom, 6, delta);
      zoomRef.current = orthographic.zoom;
    }
    camera.position.copy(currentFocus.current).add(new Vector3(14, 14, 14));
    camera.lookAt(currentFocus.current);
    orthographic.updateProjectionMatrix();
  });
  return null;
}

function LabelProjector({ worldGroup, onProject }: { worldGroup: React.RefObject<Group | null>; onProject: LabelProjectionHandler }) {
  const { camera, size } = useThree();
  const anchors = useMemo(() => (Object.keys(ZONE_NODES) as ZoneId[]).map((zone) => {
    const [x, y, z] = zoneLabelAnchor(zone);
    return { id: zone, point: new Vector3(x, y, z) };
  }), []);
  const last = useRef('');
  useFrame(() => {
    if (!worldGroup.current) return;
    const projected = anchors.map(({ id, point }) => {
      const screen = worldGroup.current!.localToWorld(point.clone()).project(camera);
      return {
        id,
        x: (screen.x * 0.5 + 0.5) * size.width,
        y: (-screen.y * 0.5 + 0.5) * size.height,
        depth: screen.z,
        width: 1,
        height: 1,
      };
    });
    const signature = projected.map(({ x, y }) => `${Math.round(x)}:${Math.round(y)}`).join('|');
    if (signature !== last.current) {
      last.current = signature;
      onProject(projected);
    }
  });
  return null;
}

function StaticBox({ module, tone, theme }: { module: WorldModule; tone: PaletteKey; theme: Props['theme'] }) {
  const { position, quarterTurns } = module.transform;
  const bridgeRunsAlongX = module.size[0] > module.size[2];
  const railHeight = 0.22;
  const elevatedPlatform = module.kind === 'platform' && position[1] >= 0.5 && module.size[0] >= 3 && module.size[2] >= 3;
  if (module.kind === 'platform') {
    return (
      <group position={position} rotation={[0, quarterTurns * Math.PI / 2, 0]}>
        <PlatformBody module={module} theme={theme} />
        {elevatedPlatform && [-1, 1].flatMap((edge) => [-1, 1].map((side) => (
          <mesh key={`rail-${edge}-${side}`} position={[side * 0.92, module.size[1] + railHeight / 2, edge * (module.size[2] / 2 - 0.05)]} castShadow>
            <boxGeometry args={[1.15, railHeight, 0.1]} /><AnimatedLambert tone="dirt" theme={theme} />
          </mesh>
        )))}
      </group>
    );
  }
  return (
    <group position={position} rotation={[0, quarterTurns * Math.PI / 2, 0]}>
      <mesh position={[0, module.size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={module.size} /><AnimatedLambert tone={tone} theme={theme} />
      </mesh>
      {module.kind === 'bridge' && [-1, 1].map((side) => (
        <mesh key={side} position={bridgeRunsAlongX
          ? [0, module.size[1] + railHeight / 2, side * (module.size[2] / 2 - 0.05)]
          : [side * (module.size[0] / 2 - 0.05), module.size[1] + railHeight / 2, 0]} castShadow>
          <boxGeometry args={bridgeRunsAlongX ? [module.size[0], railHeight, 0.1] : [0.1, railHeight, module.size[2]]} />
          <AnimatedLambert tone={tone} theme={theme} />
        </mesh>
      ))}
    </group>
  );
}

function ZonePlatform({ module, zone, theme, selected, reducedMotion, reactionSequence, onSelect }: {
  module: WorldModule; zone: ZoneId; theme: Props['theme']; selected: boolean; reducedMotion: boolean;
  reactionSequence: number; onSelect: () => void;
}) {
  const group = useRef<Group>(null);
  const moss = useRef<MeshLambertMaterial>(null);
  const [hovered, setHovered] = useState(false);
  useFrame((_state, delta) => {
    if (!group.current || !moss.current) return;
    const active = hovered || selected;
    const lift = active && !reducedMotion ? 0.04 : 0;
    group.current.position.y = MathUtils.damp(group.current.position.y, module.transform.position[1] + lift, 18, delta);
    const palette = theme === 'night' ? NIGHT : DAY;
    const target = new Color(active ? palette.coral : palette.moss);
    moss.current.color.lerp(target, 1 - Math.exp(-delta * 13));
  });
  return (
    <group ref={group} position={module.transform.position} rotation={[0, module.transform.quarterTurns * Math.PI / 2, 0]}>
      <PlatformBody
        module={module}
        theme={theme}
        mossRef={moss}
        interactive
        onSelect={onSelect}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; }}
      />
      {zone === 'experiments' && [-0.7, 0, 0.7].map((x, index) => (
        <ReactionBlock key={x} x={x} index={index} active={selected} sequence={reactionSequence} reducedMotion={reducedMotion} theme={theme} />
      ))}
    </group>
  );
}

function ReactionBlock({ x, index, active, sequence, reducedMotion, theme }: {
  x: number; index: number; active: boolean; sequence: number; reducedMotion: boolean; theme: Props['theme'];
}) {
  const ref = useRef<Mesh>(null);
  const elapsed = useRef(1);
  const { invalidate } = useThree();
  useEffect(() => { if (active) { elapsed.current = -index * .055; invalidate(); } }, [active, index, invalidate, sequence]);
  useFrame((_state, delta) => {
    if (!ref.current) return;
    elapsed.current += delta;
    const progress = Math.min(1, Math.max(0, elapsed.current / .55));
    ref.current.position.y = .28 + (reducedMotion ? 0 : Math.sin(progress * Math.PI) * .38);
    if (progress < 1) invalidate();
  });
  return <mesh ref={ref} position={[x, .28, .72]} castShadow>
    <boxGeometry args={[.42, .3, .42]} /><AnimatedLambert tone="olive" theme={theme} />
  </mesh>;
}

function StairModule({ module, theme }: { module: WorldModule; theme: Props['theme'] }) {
  const geometry = useMemo(() => {
    const steps = getStairSteps(module, WORLD_MAP.nodes);
    const merged = mergeGeometries(
      steps.map((step) => {
        const box = new BoxGeometry(...step.size);
        box.applyMatrix4(new Matrix4().makeTranslation(...step.position));
        return box;
      }),
      false,
    );
    return merged ?? new BoxGeometry(1, 1, 1);
  }, [module]);
  return (
    <group position={module.transform.position} rotation={[0, module.transform.quarterTurns * Math.PI / 2, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <AnimatedLambert tone="structure" theme={theme} />
      </mesh>
    </group>
  );
}

type RuinPart = TonedPart;

const ISLAND_RUIN_DESIGNS: Record<string, readonly RuinPart[]> = {
  'central-ruin': [
    { position: [0, 0.18, 0], size: [0.92, 0.36, 0.92], tone: 'structure' },
    { position: [0.06, 0.58, -0.04], size: [0.52, 0.62, 0.52], tone: 'structure' },
    { position: [0.22, 0.38, 0.38], size: [0.48, 0.14, 0.68], rotation: [0.22, 0.45, 0.28], tone: 'dirt' },
    { position: [-0.28, 0.1, 0.3], size: [0.24, 0.16, 0.24], tone: 'dirt' },
  ],
  'about-ruin': [
    { position: [0, 0.22, 0], size: [0.32, 0.44, 0.32], tone: 'structure' },
    { position: [0.12, 0.58, 0.06], size: [0.28, 0.52, 0.28], tone: 'structure' },
    { position: [-0.2, 0.38, -0.18], size: [0.38, 0.18, 0.28], rotation: [0.2, 0.5, 0.15], tone: 'dirt' },
    { position: [0.05, 0.92, -0.08], size: [0.36, 0.12, 0.36], rotation: [0.15, -0.25, 0.35], tone: 'structure' },
  ],
};

function IslandRuin({ module, theme }: { module: WorldModule; theme: Props['theme'] }) {
  const parts = ISLAND_RUIN_DESIGNS[module.id] ?? ISLAND_RUIN_DESIGNS['central-ruin'];
  const merged = useMemo(() => buildRuinMeshes(parts), [parts]);
  return (
    <group
      position={[
        module.transform.position[0],
        module.transform.position[1] - DECOR_GROUND_SNAP,
        module.transform.position[2],
      ]}
      rotation={[0, module.transform.quarterTurns * Math.PI / 2, 0]}
    >
      {merged.map(({ tone, geometry }) => (
        <mesh key={tone} geometry={geometry} castShadow>
          <AnimatedLambert tone={tone} theme={theme} />
        </mesh>
      ))}
    </group>
  );
}

function HabitatSea({ theme, reducedMotion }: { theme: Props['theme']; reducedMotion: boolean }) {
  const surface = useRef<Mesh>(null);
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [invalidate, reducedMotion]);
  useFrame(({ clock }) => {
    if (!surface.current || reducedMotion) {
      if (surface.current && reducedMotion) {
        surface.current.position.y = WORLD_WATER_CENTER_Y;
        const material = surface.current.material as MeshLambertMaterial;
        material.opacity = 0.9;
        material.transparent = true;
      }
      return;
    }
    surface.current.position.y = WORLD_WATER_CENTER_Y + Math.sin(clock.elapsedTime * 1.4) * 0.02;
    const material = surface.current.material as MeshLambertMaterial;
    material.opacity = 0.88 + Math.sin(clock.elapsedTime * 1.1) * 0.05;
    material.transparent = true;
    invalidate();
  });
  return (
    <mesh ref={surface} position={[0, WORLD_WATER_CENTER_Y, 0]}>
      <boxGeometry args={[WORLD_WATER_SIZE, WORLD_WATER_THICKNESS, WORLD_WATER_SIZE]} />
      <AnimatedLambert tone="water" theme={theme} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  );
}

function Water({ module, theme, reducedMotion }: { module: WorldModule; theme: Props['theme']; reducedMotion: boolean }) {
  const surface = useRef<Mesh>(null);
  const ripple = useRef<Mesh>(null);
  const [pulse, setPulse] = useState(0);
  const progress = useRef(1);
  useEffect(() => { progress.current = 0; }, [pulse]);
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [invalidate, pulse]);
  useFrame(({ clock }, delta) => {
    if (surface.current && !reducedMotion) {
      surface.current.position.y = module.size[1] / 2 + Math.sin(clock.elapsedTime * 1.4) * 0.025;
      const material = surface.current.material as MeshLambertMaterial;
      material.opacity = 0.88 + Math.sin(clock.elapsedTime * 1.1) * 0.06;
      material.transparent = true;
      invalidate();
    }
    if (!ripple.current) return;
    progress.current = Math.min(1, progress.current + (reducedMotion ? 1 : delta / 0.7));
    const scale = 0.2 + easeOutQuint(progress.current) * 2.3;
    ripple.current.scale.setScalar(scale);
    const material = ripple.current.material as MeshBasicMaterial;
    material.opacity = (1 - progress.current) * 0.65;
    if (progress.current < 1) invalidate();
  });
  const fallSteps = [
    { position: [1.6, 0.55, -1.35] as const, size: [0.55, 0.12, 0.55] as const },
    { position: [1.85, 0.2, -1.05] as const, size: [0.45, 0.35, 0.2] as const },
    { position: [1.95, -0.05, -0.7] as const, size: [0.4, 0.2, 0.35] as const },
  ];
  return (
    <group position={module.transform.position}>
      <mesh
        ref={surface}
        position={[0, module.size[1] / 2, 0]}
        receiveShadow
        onClick={(event) => { event.stopPropagation(); setPulse((value) => value + 1); }}
      >
        <boxGeometry args={module.size} /><AnimatedLambert tone="water" theme={theme} transparent opacity={0.92} />
      </mesh>
      {fallSteps.map((step, index) => (
        <mesh key={index} position={[...step.position]} castShadow receiveShadow>
          <boxGeometry args={[...step.size]} /><AnimatedLambert tone="water" theme={theme} transparent opacity={0.8} />
        </mesh>
      ))}
      <mesh ref={ripple} position={[0, module.size[1] + 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.43, 0.5, 12]} /><meshBasicMaterial color={NIGHT.coral} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Vegetation({ theme, reducedMotion }: { theme: Props['theme']; reducedMotion: boolean }) {
  const geometry = useMemo(() => buildVegetationGeometry(), []);
  const pointerSmooth = useRef({ x: 0, y: 0 });
  const advanceNightMix = useNightMix(theme, reducedMotion);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    pointerSmooth.current.x = MathUtils.damp(pointerSmooth.current.x, state.pointer.x, 5, delta);
    pointerSmooth.current.y = MathUtils.damp(pointerSmooth.current.y, state.pointer.y, 5, delta);
    deformVegetationGeometry(
      geometry,
      state.clock.elapsedTime,
      pointerSmooth.current,
      reducedMotion,
    );
    applyVegetationTheme(geometry, advanceNightMix(delta));
  });

  return (
    <mesh geometry={geometry} castShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  );
}

function Traveler({ nodeId, path, phase, theme, reducedMotion }: {
  nodeId: string; path: readonly string[]; phase: ExperiencePhase; theme: Props['theme']; reducedMotion: boolean;
}) {
  const ref = useRef<Group>(null);
  const target = useMemo(() => {
    const node = WORLD_MAP.nodes.find((item) => item.id === nodeId)!;
    return new Vector3(node.position[0], node.position[1] + 0.48, node.position[2]);
  }, [nodeId]);
  useLayoutEffect(() => { if (ref.current && ref.current.position.lengthSq() === 0) ref.current.position.copy(target); }, [target]);
  const { invalidate } = useThree();
  useEffect(() => {
    if (reducedMotion || phase !== 'explore') return;
    const timer = window.setInterval(invalidate, 120);
    return () => window.clearInterval(timer);
  }, [invalidate, phase, reducedMotion]);
  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const difference = target.clone().sub(ref.current.position);
    if (difference.lengthSq() > 0.0001) {
      ref.current.rotation.y = Math.atan2(difference.x, difference.z);
      ref.current.position.lerp(target, reducedMotion ? 1 : 1 - Math.exp(-delta * 22));
    }
    const walking = phase === 'travelling';
    ref.current.position.y = target.y + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * (walking ? 16 : 2.2)) * (walking ? 0.055 : 0.012));
    ref.current.rotation.z = reducedMotion ? 0 : MathUtils.damp(ref.current.rotation.z, walking ? 0.08 : 0, 10, delta);
    if (walking || difference.lengthSq() > .0001) invalidate();
  });
  return (
    <>
      {path.slice(1, 5).map((nodeId, index) => {
        const node = WORLD_MAP.nodes.find((item) => item.id === nodeId)!;
        return <mesh key={nodeId} position={[node.position[0], node.position[1] + 0.275, node.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.22 + index * 0.025, 0.22 + index * 0.025]} /><AnimatedLambert tone="coral" theme={theme} reducedMotion={reducedMotion} />
        </mesh>;
      })}
      <group ref={ref}>
        <mesh position={[0, 0.26, 0]} castShadow><cylinderGeometry args={[0.16, 0.22, 0.48, 6]} /><AnimatedLambert tone="coral" theme={theme} reducedMotion={reducedMotion} /></mesh>
        <mesh position={[0, 0.64, 0]} castShadow><dodecahedronGeometry args={[0.18, 0]} /><AnimatedLambert tone="head" theme={theme} /></mesh>
      </group>
    </>
  );
}

const HOBBIES_CAROUSEL_POSITION: [number, number, number] = [0, -0.25, 7];
const HOBBIES_CAROUSEL_SCALE = 1.25;
/** Bulbs sit proud of the 0.53 rim band so the lit state reads from any orbit angle. */
const HOBBIES_CAROUSEL_BULBS = 10;
const HOBBIES_CAROUSEL_BULB_RADIUS = 0.59;

/** Fairground colours, deliberately outside the habitat's muted palette. */
const CAROUSEL_DAY = {
  red: '#e8253a', cream: '#f7f1e6', rod: '#cdb98f',
  horseBlue: '#7fb2e0', horseYellow: '#f2c31e', horsePink: '#ef6ba8', horseGreen: '#4e8f4a',
};
const CAROUSEL_NIGHT = {
  red: '#a92a3c', cream: '#c8c0ad', rod: '#8a7c5f',
  horseBlue: '#5a82a8', horseYellow: '#b08f2a', horsePink: '#a85078', horseGreen: '#3c6b3a',
};
type CarouselTone = keyof typeof CAROUSEL_DAY;
const carouselTone = (tone: CarouselTone) => ({ day: CAROUSEL_DAY[tone], night: CAROUSEL_NIGHT[tone] });

type CarouselPart = TonedPart<CarouselTone>;

const HOBBIES_CAROUSEL_HORSES: readonly { angle: number; tone: CarouselTone }[] = [
  { angle: Math.PI * 0.25, tone: 'horseBlue' },
  { angle: Math.PI * 0.75, tone: 'horseYellow' },
  { angle: Math.PI * 1.25, tone: 'horsePink' },
  { angle: Math.PI * 1.75, tone: 'horseGreen' },
];

function carouselCanopyParts(): CarouselPart[] {
  return Array.from({ length: 8 }, (_unused, index): CarouselPart => {
    const angle = (index / 8) * Math.PI * 2;
    return {
      position: [Math.cos(angle) * 0.25, 1.16, Math.sin(angle) * 0.25],
      rotation: [0, -angle, -0.42],
      size: [0.58, 0.07, 0.38],
      tone: index % 2 === 0 ? 'red' : 'cream',
    };
  });
}

function carouselBulbParts(): CarouselPart[] {
  return Array.from({ length: HOBBIES_CAROUSEL_BULBS }, (_unused, index): CarouselPart => {
    const angle = (index / HOBBIES_CAROUSEL_BULBS) * Math.PI * 2;
    return {
      position: [
        Math.cos(angle) * HOBBIES_CAROUSEL_BULB_RADIUS,
        0.98,
        Math.sin(angle) * HOBBIES_CAROUSEL_BULB_RADIUS,
      ],
      rotation: [0, -angle, 0],
      size: [0.08, 0.08, 0.08],
      tone: 'cream',
    };
  });
}

function carouselRiggingParts(): CarouselPart[] {
  return HOBBIES_CAROUSEL_HORSES.map(({ angle }): CarouselPart => ({
    position: [Math.cos(angle) * 0.31, 0.73, Math.sin(angle) * 0.31],
    size: [0.03, 0.58, 0.03],
    tone: 'rod',
  }));
}

function carouselHorseParts(angle: number, tone: CarouselTone): CarouselPart[] {
  const radius = 0.31;
  const baseY = 0.44;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const limbs: readonly { offset: [number, number, number]; size: [number, number, number] }[] = [
    { offset: [0, 0, 0], size: [0.1, 0.14, 0.28] },
    { offset: [0, 0.1, 0.13], size: [0.08, 0.16, 0.08] },
    { offset: [0, 0.15, 0.18], size: [0.07, 0.07, 0.11] },
    { offset: [0, -0.11, 0.09], size: [0.05, 0.14, 0.05] },
    { offset: [0, -0.11, -0.09], size: [0.05, 0.14, 0.05] },
    { offset: [0, 0.04, -0.16], size: [0.06, 0.12, 0.05] },
  ];
  return limbs.map(({ offset, size }): CarouselPart => ({
    position: [
      cos * (radius + offset[0]) - sin * offset[2],
      baseY + offset[1],
      sin * (radius + offset[0]) + cos * offset[2],
    ],
    rotation: [0, -angle, 0],
    size,
    tone,
  }));
}

function HobbiesCarousel({ active, sequence, theme, reducedMotion, onSelect }: {
  active: boolean; sequence: number; theme: Props['theme']; reducedMotion: boolean; onSelect: () => void;
}) {
  const rotor = useRef<Group>(null);
  const bulbs = useRef<Mesh>(null);
  const bulbMaterial = useRef<MeshLambertMaterial>(null);
  const bulbFrom = useRef(new Color(DAY.sun));
  const bulbThemeElapsed = useRef(0.9);
  const elapsed = useRef(0);
  const advanceNightMix = useNightMix(theme, reducedMotion);
  const { invalidate } = useThree();
  const bulbGeometry = useMemo(() => buildRuinMeshes(carouselBulbParts())[0]!.geometry, []);
  const canopy = useMemo(() => buildRuinMeshes(carouselCanopyParts()), []);
  const rigging = useMemo(() => buildRuinMeshes(carouselRiggingParts()), []);
  const horses = useMemo(
    () => buildRuinMeshes(
      HOBBIES_CAROUSEL_HORSES.flatMap(({ angle, tone }) => carouselHorseParts(angle, tone)),
    ),
    [],
  );

  useEffect(() => {
    if (active) elapsed.current = 0;
    bulbThemeElapsed.current = 0;
    if (bulbMaterial.current) bulbFrom.current.copy(bulbMaterial.current.color);
    invalidate();
  }, [active, invalidate, sequence, theme]);

  useFrame((_state, delta) => {
    if (!reducedMotion) elapsed.current += delta;
    const spinSpeed = carouselSpinSpeed(elapsed.current, active, reducedMotion);
    // Negative yaw reads as clockwise from the orthographic camera looking down.
    if (rotor.current) rotor.current.rotation.y -= delta * spinSpeed;
    const nightMix = advanceNightMix(delta);
    if (!reducedMotion) bulbThemeElapsed.current += delta;
    else bulbThemeElapsed.current = 0.9;
    const themeProgress = themeTransitionProgress(bulbThemeElapsed.current);
    const glow = MathUtils.lerp(
      carouselBulbGlow(elapsed.current, false, active, reducedMotion),
      carouselBulbGlow(elapsed.current, true, active, reducedMotion),
      nightMix,
    );
    if (bulbMaterial.current) {
      updateGoldRingLambert(bulbMaterial.current, {
        fromColor: bulbFrom.current,
        theme,
        transitionProgress: themeProgress,
        emissiveMix: glow,
      });
    }
    if (bulbs.current) bulbs.current.visible = glow > 0.02;
    if (glow > 0.02 || bulbThemeElapsed.current < 0.9) invalidate();
    // The burst is the only carousel motion the 50ms idle tick renders too coarsely.
    if (spinSpeed > CAROUSEL_IDLE_SPIN_SPEED * 1.02) invalidate();
  });

  return (
    <group
      position={HOBBIES_CAROUSEL_POSITION}
      scale={HOBBIES_CAROUSEL_SCALE}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.58, 0.58, 0.1, 10]} />
        <AnimatedLambert tone={carouselTone('red')} theme={theme} />
      </mesh>
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.08, 10]} />
        <AnimatedLambert tone={carouselTone('cream')} theme={theme} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.1, 0.84, 0.1]} />
        <AnimatedLambert tone={carouselTone('cream')} theme={theme} />
      </mesh>
      <group ref={rotor}>
        <mesh position={[0, 1.02, 0]} castShadow>
          <cylinderGeometry args={[0.53, 0.53, 0.15, 10]} />
          <AnimatedLambert tone={carouselTone('red')} theme={theme} />
        </mesh>
        {canopy.map(({ tone, geometry }) => (
          <mesh key={`canopy-${tone}`} geometry={geometry} castShadow>
            <AnimatedLambert tone={carouselTone(tone)} theme={theme} />
          </mesh>
        ))}
        {rigging.map(({ tone, geometry }) => (
          <mesh key={`rigging-${tone}`} geometry={geometry}>
            <AnimatedLambert tone={carouselTone(tone)} theme={theme} />
          </mesh>
        ))}
        {horses.map(({ tone, geometry }) => (
          <mesh key={`horse-${tone}`} geometry={geometry} castShadow>
            <AnimatedLambert tone={carouselTone(tone)} theme={theme} />
          </mesh>
        ))}
        <mesh ref={bulbs} geometry={bulbGeometry} castShadow visible={theme === 'night'}>
          <meshLambertMaterial
            ref={bulbMaterial}
            color={DAY.sun}
            flatShading
          />
        </mesh>
      </group>
    </group>
  );
}

type RuinPiece = {
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
  tone: PaletteKey;
};

const ISLAND_RUINS: readonly RuinPiece[] = [
  // Home — scattered rubble pile (SE corner, clear of central ruin SW)
  { position: [1.45, 0.18, 1.65], rotation: [0, 0.35, 0.08], size: [0.7, 0.28, 0.4], tone: 'structure' },
  { position: [1.75, 0.32, 1.45], rotation: [0.15, -0.4, 0.2], size: [0.35, 0.22, 0.28], tone: 'structure' },
  { position: [1.15, 0.14, 1.85], rotation: [0, 0.9, -0.1], size: [0.28, 0.16, 0.45], tone: 'dirt' },
  { position: [1.55, 0.42, 1.75], rotation: [0.25, 0.2, 0.15], size: [0.22, 0.2, 0.22], tone: 'structure' },
];

function RuinAccents({ theme }: { theme: Props['theme'] }) {
  const byTone = useMemo(() => {
    const groups = new Map<PaletteKey, RuinPiece[]>();
    for (const piece of ISLAND_RUINS) {
      const list = groups.get(piece.tone) ?? [];
      list.push(piece);
      groups.set(piece.tone, list);
    }
    return [...groups.entries()];
  }, []);

  return (
    <>
      {byTone.map(([tone, pieces]) => (
        <RuinInstances key={tone} pieces={pieces} tone={tone} theme={theme} />
      ))}
    </>
  );
}

function SpawnLandingPad({ theme, reducedMotion }: { theme: WorldTheme; reducedMotion: boolean }) {
  const structureMaterial = useRef<MeshLambertMaterial>(null);
  const frameMesh = useRef<Mesh>(null);
  const padFrom = useRef(new Color(LANDING_PAD.day));
  const themeElapsed = useRef(0.9);
  const advanceNightMix = useNightMix(theme, reducedMotion);
  const structureGeometry = useMemo(() => buildLandingPadStructureGeometry(), []);
  const patternGeometry = useMemo(
    () => buildLandingPadPatternGeometry(),
    [],
  );
  const { invalidate } = useThree();

  useEffect(() => () => {
    structureGeometry.dispose();
    patternGeometry.dispose();
  }, [patternGeometry, structureGeometry]);

  useEffect(() => {
    themeElapsed.current = 0;
    if (structureMaterial.current) padFrom.current.copy(structureMaterial.current.color);
    invalidate();
  }, [invalidate, theme]);

  useFrame((state, delta) => {
    const nightMix = advanceNightMix(delta);
    if (!reducedMotion) themeElapsed.current += delta;
    else themeElapsed.current = 0.9;
    const themeProgress = themeTransitionProgress(themeElapsed.current);
    if (structureMaterial.current) {
      updateLandingPadLambert(structureMaterial.current, {
        fromColor: padFrom.current,
        theme,
        transitionProgress: themeProgress,
      });
    }
    if (frameMesh.current) {
      const material = frameMesh.current.material as MeshBasicMaterial;
      material.color.lerpColors(TOWER_WINDOW_DAY_COLOR, TOWER_WINDOW_NIGHT_COLOR, nightMix);
      material.opacity = MathUtils.lerp(
        towerWindowGlow(state.clock.elapsedTime, false, false, reducedMotion),
        towerWindowGlow(state.clock.elapsedTime, true, false, reducedMotion),
        nightMix,
      );
    }
    if (themeElapsed.current < 0.9 || theme === 'night') invalidate();
  });

  return (
    <group>
      <mesh geometry={structureGeometry} castShadow receiveShadow>
        <meshLambertMaterial
          ref={structureMaterial}
          color={LANDING_PAD.day}
          flatShading
        />
      </mesh>
      <mesh ref={frameMesh} geometry={patternGeometry} renderOrder={1}>
        <meshBasicMaterial
          color={LANDING_PAD_TILE.day}
          transparent
          opacity={towerWindowGlow(0, theme === 'night', false, true)}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function RuinInstances({
  pieces,
  tone,
  theme,
}: {
  pieces: readonly RuinPiece[];
  tone: PaletteKey;
  theme: Props['theme'];
}) {
  const ruins = useRef<InstancedMesh>(null);
  const object = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    if (!ruins.current) return;
    pieces.forEach((piece, index) => {
      object.position.set(...piece.position);
      object.rotation.set(...(piece.rotation ?? [0, 0, 0]));
      object.scale.set(...piece.size);
      object.updateMatrix();
      ruins.current!.setMatrixAt(index, object.matrix);
    });
    ruins.current.instanceMatrix.needsUpdate = true;
  }, [pieces, object]);
  return (
    <instancedMesh ref={ruins} args={[undefined, undefined, pieces.length]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <AnimatedLambert tone={tone} theme={theme} />
    </instancedMesh>
  );
}

export function WorldScene(props: Props) {
  const worldGroup = useRef<Group>(null);
  const dusk = useRef(props.theme === 'night' ? 1 : 0);
  const { gl, invalidate } = useThree();
  const motionUntil = useRef(0);
  const activeZone = props.phase === 'arriving' || props.phase === 'opening-window' ? props.targetZone ?? props.selectedZone : props.selectedZone;
  useEffect(() => {
    gl.setClearColor(props.theme === 'night' ? NIGHT.sky : DAY.sky, 0);
    motionUntil.current = props.reducedMotion ? 0 : performance.now() + 950;
    invalidate();
  }, [gl, invalidate, props.theme, props.reactionSequence, props.selectedZone, props.reducedMotion]);
  useFrame((_state, delta) => {
    if (!worldGroup.current) return;
    const desired = nearestEquivalentAngle(worldGroup.current.rotation.y, props.rotationAngle);
    worldGroup.current.rotation.y = props.reducedMotion ? desired : MathUtils.damp(worldGroup.current.rotation.y, desired, 18, delta);
    if (Math.abs(worldGroup.current.rotation.y - desired) > .001 || performance.now() < motionUntil.current || props.phase === 'travelling') invalidate();
  });

  const zoneByPlatform: Partial<Record<string, ZoneId>> = {
    'work-platform': 'work', 'notes-platform': 'field-notes', 'experiments-platform': 'experiments',
    'hobbies-platform': 'hobbies', 'about-platform': 'about',
  };

  return (
    <>
      <AmbientMotionDriver reducedMotion={props.reducedMotion} />
      <SceneLight theme={props.theme} reducedMotion={props.reducedMotion} dusk={dusk} />
      <CameraRig selectedZone={props.selectedZone} rotationAngle={props.rotationAngle} reducedMotion={props.reducedMotion} />
      <CelestialBodies theme={props.theme} dusk={dusk} />
      <LabelProjector worldGroup={worldGroup} onProject={props.onLabelsProject} />
      <group ref={worldGroup}>
        <HabitatSea theme={props.theme} reducedMotion={props.reducedMotion} />
        {WORLD_MAP.modules.map((module) => {
          const zone = zoneByPlatform[module.id];
          if (zone) return <ZonePlatform key={module.id} module={module} zone={zone} theme={props.theme} selected={activeZone === zone} reducedMotion={props.reducedMotion} reactionSequence={props.reactionSequence} onSelect={() => props.onZoneRequest(zone)} />;
          if (module.kind === 'stair') return <StairModule key={module.id} module={module} theme={props.theme} />;
          if (module.kind === 'tower') {
            return (
              <TowerModule
                key={module.id}
                module={module}
                theme={props.theme}
                active={
                  (module.id === 'work-tower' && activeZone === 'work')
                  || (module.id === 'notes-tower' && activeZone === 'field-notes')
                  || (module.id === 'experiments-tower' && activeZone === 'experiments')
                  || (module.id === 'about-tower' && activeZone === 'about')
                }
                reducedMotion={props.reducedMotion}
                reactionSequence={props.reactionSequence}
              />
            );
          }
          if (module.kind === 'ruin') {
            return (
              <IslandRuin
                key={module.id}
                module={module}
                theme={props.theme}
              />
            );
          }
          if (module.kind === 'water') return <Water key={module.id} module={module} theme={props.theme} reducedMotion={props.reducedMotion} />;
          return <StaticBox key={module.id} module={module} tone="structure" theme={props.theme} />;
        })}
        <HobbiesCarousel
          active={activeZone === 'hobbies'}
          sequence={props.reactionSequence}
          theme={props.theme}
          reducedMotion={props.reducedMotion}
          onSelect={() => props.onZoneRequest('hobbies')}
        />
        <Vegetation theme={props.theme} reducedMotion={props.reducedMotion} />
        <RuinAccents theme={props.theme} />
        <SpawnLandingPad theme={props.theme} reducedMotion={props.reducedMotion} />
        <Traveler nodeId={props.characterNodeId} path={props.path} phase={props.phase} theme={props.theme} reducedMotion={props.reducedMotion} />
        <mesh position={[0, WORLD_SHADOW_PLANE_Y, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[WORLD_WATER_SIZE, WORLD_WATER_SIZE]} />
          <shadowMaterial color={new Color((props.theme === 'night' ? NIGHT : DAY).shadow)} opacity={props.theme === 'night' ? 0.42 : 0.19} transparent />
        </mesh>
      </group>
    </>
  );
}
