import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/** Shared low-rate demand tick for idle carousel spin and tower ambient life. */
export const AMBIENT_TICK_MS = 50;

export function AmbientMotionDriver({ reducedMotion }: { reducedMotion: boolean }) {
  const { invalidate } = useThree();
  useEffect(() => {
    if (reducedMotion) return undefined;
    const timer = window.setInterval(invalidate, AMBIENT_TICK_MS);
    return () => window.clearInterval(timer);
  }, [invalidate, reducedMotion]);
  return null;
}
