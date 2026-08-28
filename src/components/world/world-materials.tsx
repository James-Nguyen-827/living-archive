import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, MathUtils, MeshLambertMaterial } from 'three';
import { themeTransitionProgress } from './world-motion';

export const DAY = {
  surface: '#dfe0cf', structure: '#b8c28d', olive: '#53652d', moss: '#6f8f2f', dirt: '#7a6848',
  coral: '#e75f49', water: '#65bdc5', shadow: '#687055', sky: '#ffffff', sun: '#f4c84d', moon: '#dce8dc',
  head: '#f4f1e4',
};
export const NIGHT = {
  surface: '#3a4554', structure: '#5a6b78', olive: '#8fb85a', moss: '#7eab3d', dirt: '#6a5d48',
  coral: '#ff795b', water: '#4aa0b0', shadow: '#1c2430', sky: '#2a3550', sun: '#82512e', moon: '#d5e8c0',
  head: '#efe8d2',
};
export const TOWER_WINDOW = { day: '#f2d489', night: '#ffd35c' };
export const TOWER_WINDOW_DAY_COLOR = new Color(TOWER_WINDOW.day);
export const TOWER_WINDOW_NIGHT_COLOR = new Color(TOWER_WINDOW.night);
export const DECOR_GROUND_SNAP = 0.25;

export type WorldTheme = 'day' | 'night';
export type PaletteKey = keyof typeof DAY;
export type Tone = PaletteKey | { day: string; night: string };

export const toneColor = (tone: Tone, theme: WorldTheme) =>
  typeof tone === 'string' ? (theme === 'night' ? NIGHT : DAY)[tone] : (theme === 'night' ? tone.night : tone.day);

export function AnimatedLambert({ tone, theme, transparent = false, opacity = 1, depthWrite = true }: {
  tone: Tone; theme: WorldTheme; transparent?: boolean; opacity?: number; depthWrite?: boolean;
}) {
  const material = useRef<MeshLambertMaterial>(null);
  const from = useRef(new Color(toneColor(tone, 'day')));
  const elapsed = useRef(0.9);
  useEffect(() => {
    if (material.current) from.current.copy(material.current.color);
    elapsed.current = 0;
  }, [theme]);
  const { invalidate } = useThree();
  useFrame((_state, delta) => {
    if (!material.current) return;
    elapsed.current += delta;
    material.current.color.lerpColors(from.current, new Color(toneColor(tone, theme)), themeTransitionProgress(elapsed.current));
    if (elapsed.current < 0.9) invalidate();
  });
  return <meshLambertMaterial ref={material} color={toneColor(tone, theme)} flatShading transparent={transparent} opacity={opacity} depthWrite={depthWrite} />;
}

export function useNightMix(theme: WorldTheme, reducedMotion: boolean): (delta: number) => number {
  const mix = useRef(theme === 'night' ? 1 : 0);
  const from = useRef(mix.current);
  const elapsed = useRef(0.9);
  const { invalidate } = useThree();
  useEffect(() => {
    from.current = mix.current;
    elapsed.current = 0;
    invalidate();
  }, [invalidate, theme]);
  return (delta: number) => {
    const target = theme === 'night' ? 1 : 0;
    if (reducedMotion) {
      mix.current = target;
      elapsed.current = 0.9;
    } else {
      elapsed.current += delta;
      mix.current = MathUtils.lerp(from.current, target, themeTransitionProgress(elapsed.current));
    }
    if (elapsed.current < 0.9) invalidate();
    return mix.current;
  };
}
