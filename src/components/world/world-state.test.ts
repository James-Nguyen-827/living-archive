import { describe, expect, it } from 'vitest';
import { createInitialWorldState, worldReducer } from './world-state';

describe('worldReducer playable experience', () => {
  it('starts guided travel and clears an existing window', () => {
    const open = {
      ...createInitialWorldState('spawn'),
      phase: 'zone-open' as const,
      selectedZone: 'hobbies' as const,
      windowContent: { kind: 'zone' as const, zone: 'hobbies' as const },
    };
    const next = worldReducer(open, {
      type: 'travel-requested', zone: 'work', path: ['spawn', 'work-01', 'work-zone'],
    });
    expect(next).toMatchObject({
      phase: 'travelling', targetZone: 'work', selectedZone: null, windowContent: null,
      path: ['spawn', 'work-01', 'work-zone'],
    });
  });

  it('moves one authored node at a time and enters the arrival phase', () => {
    const travelling = worldReducer(createInitialWorldState('spawn'), {
      type: 'travel-requested', zone: 'work', path: ['spawn', 'bridge', 'work-zone'],
    });
    const first = worldReducer(travelling, { type: 'walk-step-completed' });
    const final = worldReducer(first, { type: 'walk-step-completed' });
    expect(first).toMatchObject({ characterNodeId: 'bridge', phase: 'travelling' });
    expect(final).toMatchObject({ characterNodeId: 'work-zone', phase: 'arriving', targetZone: 'work', path: [] });
  });

  it('opens a zone window only after its arrival reaction completes', () => {
    const arriving = { ...createInitialWorldState('work-zone'), phase: 'arriving' as const, targetZone: 'work' as const };
    const opening = worldReducer(arriving, { type: 'arrival-completed' });
    const open = worldReducer(opening, { type: 'window-opened' });
    expect(opening).toMatchObject({
      phase: 'opening-window', selectedZone: 'work', targetZone: null,
      windowContent: { kind: 'zone', zone: 'work' },
    });
    expect(open.phase).toBe('zone-open');
  });

  it('morphs between a zone list and an entry preview without stacking windows', () => {
    const open = {
      ...createInitialWorldState('work-zone'), phase: 'zone-open' as const, selectedZone: 'work' as const,
      windowContent: { kind: 'zone' as const, zone: 'work' as const },
    };
    const preview = worldReducer(open, { type: 'entry-requested', href: '/work/civic-signal' });
    const returned = worldReducer(preview, { type: 'zone-returned' });
    expect(preview).toMatchObject({ phase: 'entry-preview', windowContent: { kind: 'entry', zone: 'work', href: '/work/civic-signal' } });
    expect(returned).toMatchObject({ phase: 'zone-open', windowContent: { kind: 'zone', zone: 'work' } });
  });

  it('keeps closing content mounted until the exit animation completes', () => {
    const open = { ...createInitialWorldState('spawn'), phase: 'zone-open' as const, windowContent: { kind: 'index' as const } };
    const closing = worldReducer(open, { type: 'window-close-requested' });
    const closed = worldReducer(closing, { type: 'window-closed' });
    expect(closing.phase).toBe('closing-window');
    expect(closing.windowContent).toEqual({ kind: 'index' });
    expect(closed).toMatchObject({ phase: 'explore', windowContent: null, selectedZone: null });
  });

  it('returns the traveler home without opening a zone window', () => {
    const away = {
      ...createInitialWorldState('work-zone'),
      phase: 'explore' as const,
    };
    const walking = worldReducer(away, {
      type: 'return-home-requested',
      path: ['work-zone', 'work-01', 'spawn'],
    });
    const mid = worldReducer(walking, { type: 'walk-step-completed' });
    const arrived = worldReducer(mid, { type: 'walk-step-completed' });
    const home = worldReducer(arrived, { type: 'arrival-completed' });
    expect(walking).toMatchObject({ phase: 'travelling', targetZone: null, path: ['work-zone', 'work-01', 'spawn'] });
    expect(arrived).toMatchObject({ characterNodeId: 'spawn', phase: 'arriving', targetZone: null });
    expect(home).toMatchObject({ phase: 'explore', characterNodeId: 'spawn', windowContent: null });
  });

  it('snaps home immediately when already on the return path of length one', () => {
    const away = { ...createInitialWorldState('work-zone'), phase: 'explore' as const };
    const home = worldReducer(away, { type: 'return-home-requested', path: ['spawn'] });
    expect(home).toMatchObject({ phase: 'explore', characterNodeId: 'spawn', path: [] });
  });

  it('restores a direct zone link immediately at its destination', () => {
    const restored = worldReducer(createInitialWorldState('spawn'), {
      type: 'zone-restored', zone: 'about', nodeId: 'about-zone',
    });
    expect(restored).toMatchObject({
      phase: 'zone-open', characterNodeId: 'about-zone', selectedZone: 'about',
      windowContent: { kind: 'zone', zone: 'about' },
    });
  });

  it('restores index and entry history states without rebuilding a modal stack', () => {
    const initial = createInitialWorldState('spawn');
    const index = worldReducer(initial, { type: 'window-restored', content: { kind: 'index' } });
    const entry = worldReducer(index, {
      type: 'window-restored',
      content: { kind: 'entry', zone: 'work', href: '/work/civic-signal' },
      nodeId: 'work-zone',
    });
    expect(index).toMatchObject({ phase: 'zone-open', selectedZone: null, windowContent: { kind: 'index' } });
    expect(entry).toMatchObject({ phase: 'entry-preview', selectedZone: 'work', characterNodeId: 'work-zone' });
  });

  it('switches theme without interrupting guided travel', () => {
    const travelling = {
      ...createInitialWorldState('spawn'), phase: 'travelling' as const,
      targetZone: 'work' as const, path: ['spawn', 'work-zone'],
    };
    const next = worldReducer(travelling, { type: 'theme-changed', theme: 'night' });
    expect(next).toMatchObject({ theme: 'night', phase: 'travelling', targetZone: 'work', path: ['spawn', 'work-zone'] });
  });
});
