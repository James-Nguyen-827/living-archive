import { describe, expect, it } from 'vitest';
import { resolveLabelLayout } from './label-layout';

describe('projected label layout', () => {
  it('clamps authored labels inside the viewport', () => {
    const [label] = resolveLabelLayout(
      [{ id: 'work', x: -30, y: 900, depth: 0, width: 100, height: 30 }],
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
      [{ id: 'hobbies', x: 220, y: 180, depth: 0.4, width: 110, height: 32 }],
      { width: 500, height: 300, padding: 12 },
    );
    expect(label.y).toBe(180);
  });
});
