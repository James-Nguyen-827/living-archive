import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, MathUtils, MeshLambertMaterial } from 'three';
import { coralBeaconGlow, themeTransitionProgress } from './world-motion';

export const DAY = {
  surface: '#dfe0cf', structure: '#b8c28d', olive: '#53652d', moss: '#6f8f2f', dirt: '#7a6848',
  coral: '#e75f49', water: '#65bdc5', shadow: '#687055', sky: '#ffffff', sun: '#f4c84d', moon: '#dce8dc',
  head: '#f4f1e4',
};
export const NIGHT = {
  surface: '#6e685c', structure: '#928a7a', olive: '#8fb85a', moss: '#7eab3d', dirt: '#8a7860',
  coral: '#ff9a72', water: '#4aa0b0', shadow: '#1c2430', sky: '#2a3550', sun: '#82512e', moon: '#d5e8c0',
  head: '#f8f3e6',
};
export const CORAL_BEACON_EMISSIVE = { day: '#000000', night: '#ff8a60' };
export const CORAL_BEACON_EMISSIVE_DAY_COLOR = new Color(CORAL_BEACON_EMISSIVE.day);
export const CORAL_BEACON_EMISSIVE_NIGHT_COLOR = new Color(CORAL_BEACON_EMISSIVE.night);
export const CORAL_BEACON_EMISSIVE_INTENSITY = 3;
export const TOWER_WINDOW = { day: '#f2d489', night: '#ffd35c' };
export const ORRERY_RING_GLOW = { day: '#f4c84d', night: '#ffd35c' };
export const ORRERY_HUB_GLOW = { day: '#e75f49', night: '#ff9a78' };
export const ORRERY_BEACON_LIGHT = '#ffc87a';
export const TOWER_WINDOW_DAY_COLOR = new Color(TOWER_WINDOW.day);
export const TOWER_WINDOW_NIGHT_COLOR = new Color(TOWER_WINDOW.night);
export const ORRERY_RING_GLOW_DAY_COLOR = new Color(ORRERY_RING_GLOW.day);
export const ORRERY_RING_GLOW_NIGHT_COLOR = new Color(ORRERY_RING_GLOW.night);
export const ORRERY_HUB_GLOW_DAY_COLOR = new Color(ORRERY_HUB_GLOW.day);
export const ORRERY_HUB_GLOW_NIGHT_COLOR = new Color(ORRERY_HUB_GLOW.night);
export const DECOR_GROUND_SNAP = 0.25;

export type WorldTheme = 'day' | 'night';
export type PaletteKey = keyof typeof DAY;
export type Tone = PaletteKey | { day: string; night: string };

export const toneColor = (tone: Tone, theme: WorldTheme) =>
  typeof tone === 'string' ? (theme === 'night' ? NIGHT : DAY)[tone] : (theme === 'night' ? tone.night : tone.day);

export function AnimatedLambert({ tone, theme, transparent = false, opacity = 1, depthWrite = true, reducedMotion = false }: {
  tone: Tone; theme: WorldTheme; transparent?: boolean; opacity?: number; depthWrite?: boolean; reducedMotion?: boolean;
}) {
  const material = useRef<MeshLambertMaterial>(null);
  const from = useRef(new Color(toneColor(tone, 'day')));
  const elapsed = useRef(0.9);
  const isCoral = tone === 'coral';
  useEffect(() => {
    if (material.current) from.current.copy(material.current.color);
    elapsed.current = 0;
  }, [theme]);
  const { invalidate } = useThree();
  useFrame((state, delta) => {
    if (!material.current) return;
    if (!reducedMotion) elapsed.current += delta;
    else elapsed.current = 0.9;
    const progress = themeTransitionProgress(elapsed.current);
    material.current.color.lerpColors(from.current, new Color(toneColor(tone, theme)), progress);
    if (isCoral) {
      const nightMix = theme === 'night' ? progress : 1 - progress;
      const glow = coralBeaconGlow(state.clock.elapsedTime, theme === 'night', reducedMotion);
      material.current.emissive.lerpColors(
        CORAL_BEACON_EMISSIVE_DAY_COLOR,
        CORAL_BEACON_EMISSIVE_NIGHT_COLOR,
        nightMix,
      );
      material.current.emissiveIntensity = nightMix * glow * CORAL_BEACON_EMISSIVE_INTENSITY;
    }
    if (!reducedMotion && elapsed.current < 0.9) invalidate();
    if (isCoral && theme === 'night') invalidate();
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
