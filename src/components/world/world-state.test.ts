import { describe, expect, it } from 'vitest';
import { createInitialWorldState, worldReducer } from './world-state';

describe('worldReducer playable experience', () => {
  it('starts guided travel and clears an existing window', () => {
    const open = {
      ...createInitialWorldState('spawn'),
      phase: 'zone-open' as const,
      selectedZone: 'interests' as const,
      windowContent: { kind: 'zone' as const, zone: 'interests' as const },
    };
    const next = worldReducer(open, {
      type: 'travel-requested', zone: 'employment', path: ['spawn', 'employment-01', 'employment-zone'],
    });
    expect(next).toMatchObject({
      phase: 'travelling', targetZone: 'employment', selectedZone: null, windowContent: null,
      path: ['spawn', 'employment-01', 'employment-zone'],
    });
  });

  it('moves one authored node at a time and enters the arrival phase', () => {
    const travelling = worldReducer(createInitialWorldState('spawn'), {
      type: 'travel-requested', zone: 'employment', path: ['spawn', 'bridge', 'employment-zone'],
    });
    const first = worldReducer(travelling, { type: 'walk-step-completed' });
    const final = worldReducer(first, { type: 'walk-step-completed' });
    expect(first).toMatchObject({ characterNodeId: 'bridge', phase: 'travelling' });
    expect(final).toMatchObject({ characterNodeId: 'employment-zone', phase: 'arriving', targetZone: 'employment', path: [] });
  });

  it('opens a zone window only after its arrival reaction completes', () => {
    const arriving = { ...createInitialWorldState('employment-zone'), phase: 'arriving' as const, targetZone: 'employment' as const };
    const opening = worldReducer(arriving, { type: 'arrival-completed' });
    const open = worldReducer(opening, { type: 'window-opened' });
    expect(opening).toMatchObject({
      phase: 'opening-window', selectedZone: 'employment', targetZone: null,
      windowContent: { kind: 'zone', zone: 'employment' },
    });
    expect(open.phase).toBe('zone-open');
  });

  it('morphs between a zone list and an entry preview without stacking windows', () => {
    const open = {
      ...createInitialWorldState('employment-zone'), phase: 'zone-open' as const, selectedZone: 'employment' as const,
      windowContent: { kind: 'zone' as const, zone: 'employment' as const },
    };
    const preview = worldReducer(open, { type: 'entry-requested', href: '/employment/civic-signal' });
    const returned = worldReducer(preview, { type: 'zone-returned' });
    expect(preview).toMatchObject({ phase: 'entry-preview', windowContent: { kind: 'entry', zone: 'employment', href: '/employment/civic-signal' } });
    expect(returned).toMatchObject({ phase: 'zone-open', windowContent: { kind: 'zone', zone: 'employment' } });
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
      ...createInitialWorldState('employment-zone'),
      phase: 'explore' as const,
    };
    const walking = worldReducer(away, {
      type: 'return-home-requested',
      path: ['employment-zone', 'employment-01', 'spawn'],
    });
    const mid = worldReducer(walking, { type: 'walk-step-completed' });
    const arrived = worldReducer(mid, { type: 'walk-step-completed' });
    const home = worldReducer(arrived, { type: 'arrival-completed' });
    expect(walking).toMatchObject({ phase: 'travelling', targetZone: null, path: ['employment-zone', 'employment-01', 'spawn'] });
    expect(arrived).toMatchObject({ characterNodeId: 'spawn', phase: 'arriving', targetZone: null });
    expect(home).toMatchObject({ phase: 'explore', characterNodeId: 'spawn', windowContent: null });
  });

  it('snaps home immediately when already on the return path of length one', () => {
    const away = { ...createInitialWorldState('employment-zone'), phase: 'explore' as const };
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
      content: { kind: 'entry', zone: 'employment', href: '/employment/civic-signal' },
      nodeId: 'employment-zone',
    });
    expect(index).toMatchObject({ phase: 'zone-open', selectedZone: null, windowContent: { kind: 'index' } });
    expect(entry).toMatchObject({ phase: 'entry-preview', selectedZone: 'employment', characterNodeId: 'employment-zone' });
  });

  it('switches theme without interrupting guided travel', () => {
    const travelling = {
      ...createInitialWorldState('spawn'), phase: 'travelling' as const,
      targetZone: 'employment' as const, path: ['spawn', 'employment-zone'],
    };
    const next = worldReducer(travelling, { type: 'theme-changed', theme: 'night' });
    expect(next).toMatchObject({ theme: 'night', phase: 'travelling', targetZone: 'employment', path: ['spawn', 'employment-zone'] });
  });
});
