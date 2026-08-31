import { describe, expect, it } from 'vitest';
import * as labelLayout from './label-layout';

const { resolveLabelLayout } = labelLayout;

describe('projected label layout', () => {
  it('clamps authored labels inside the viewport', () => {
    const [label] = resolveLabelLayout(
      [{ id: 'employment', x: -30, y: 900, depth: 0, width: 100, height: 30 }],
      { width: 400, height: 300, padding: 12 },
    );
    expect(label.x).toBe(62);
    expect(label.y).toBe(273);
  });

  it('resolves collisions horizontally without shifting label height', () => {
    const labels = resolveLabelLayout([
      { id: 'near', x: 200, y: 120, depth: 0.1, width: 110, height: 32 },
      { id: 'far', x: 200, y: 120, depth: 0.8, width: 110, height: 32 },
    ], { width: 500, height: 300, padding: 12 });
    expect(labels[0]).toMatchObject({ id: 'near', x: 200, y: 120 });
    expect(labels[1].id).toBe('far');
    expect(labels[1].y).toBe(120);
    expect(labels[1].x).not.toBe(200);
  });

  it('pins each label to its projected anchor height after viewport clamping', () => {
    const [label] = resolveLabelLayout(
      [{ id: 'interests', x: 220, y: 180, depth: 0.4, width: 110, height: 32 }],
      { width: 500, height: 300, padding: 12 },
    );
    expect(label.y).toBe(180);
  });

  it('keeps labels above a bottom-occluded region', () => {
    const [label] = resolveLabelLayout(
      [{ id: 'interests', x: 220, y: 260, depth: 0.4, width: 110, height: 30 }],
      { width: 500, height: 300, padding: 12, bottomOcclusion: 140 } as Parameters<typeof resolveLabelLayout>[1] & { bottomOcclusion: number },
    );
    expect(label.y).toBe(133);
  });

  it('measures only a full-width bottom sheet as a bottom occlusion', () => {
    const bottomOcclusionHeight = (labelLayout as typeof labelLayout & {
      bottomOcclusionHeight?: (
        viewport: { top: number; right: number; bottom: number; left: number },
        occluder: { top: number; right: number; bottom: number; left: number } | null,
      ) => number;
    }).bottomOcclusionHeight;
    const viewport = { top: 0, right: 360, bottom: 300, left: 0 };

    expect(bottomOcclusionHeight?.(
      viewport,
      { top: 144, right: 360, bottom: 300, left: 0 },
    )).toBe(156);
    expect(bottomOcclusionHeight?.(
      viewport,
      { top: 0, right: 360, bottom: 300, left: 240 },
    )).toBe(0);
    expect(bottomOcclusionHeight?.(viewport, null)).toBe(0);
  });
});
