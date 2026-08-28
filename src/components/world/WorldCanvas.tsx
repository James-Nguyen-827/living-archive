import { Canvas } from '@react-three/fiber';
import { WorldScene, type LabelProjectionHandler } from './WorldScene';
import type { ExperiencePhase, ZoneId } from './world-types';

interface Props {
  rotationAngle: number;
  theme: 'day' | 'night';
  phase: ExperiencePhase;
  characterNodeId: string;
  path: readonly string[];
  targetZone: ZoneId | null;
  selectedZone: ZoneId | null;
  reactionSequence: number;
  reducedMotion: boolean;
  onZoneRequest: (zone: ZoneId) => void;
  onLabelsProject: LabelProjectionHandler;
  onReady: () => void;
}

export function WorldCanvas({ onReady, ...sceneProps }: Props) {
  return (
    <Canvas
      orthographic
      dpr={[1, 1.5]}
      frameloop="demand"
      shadows="basic"
      camera={{ position: [14, 14, 14], zoom: 40, near: 0.1, far: 100 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(sceneProps.theme === 'night' ? '#2a3550' : '#ffffff', 0);
        onReady();
      }}
    >
      <WorldScene {...sceneProps} />
    </Canvas>
  );
}
