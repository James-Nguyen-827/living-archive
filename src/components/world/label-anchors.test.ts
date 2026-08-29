import { describe, expect, it } from 'vitest';
import { LABEL_CLEARANCE, sculptureTopY, zoneLabelAnchor } from './label-anchors';
import type { ZoneId } from './world-types';

const ZONES: ZoneId[] = ['work', 'field-notes', 'experiments', 'hobbies', 'about'];

describe('zone label anchors', () => {
  it('places anchors on the horizontal center of each sculpture', () => {
    expect(zoneLabelAnchor('work')).toEqual([-7, expect.any(Number), 0]);
    expect(zoneLabelAnchor('field-notes')[0]).toBe(0);
    expect(zoneLabelAnchor('field-notes')[2]).toBe(-8);
    expect(zoneLabelAnchor('experiments')[0]).toBe(8);
    expect(zoneLabelAnchor('experiments')[2]).toBe(-1);
    expect(zoneLabelAnchor('about')[0]).toBe(7);
    expect(zoneLabelAnchor('about')[2]).toBe(8);
    expect(zoneLabelAnchor('hobbies')[0]).toBe(0);
    expect(zoneLabelAnchor('hobbies')[2]).toBe(7);
  });

  it('keeps every label a uniform distance above its sculpture top', () => {
    for (const zone of ZONES) {
      const [, anchorY] = zoneLabelAnchor(zone);
      expect(anchorY - sculptureTopY(zone)).toBeCloseTo(LABEL_CLEARANCE, 5);
    }
  });

  it('sits work lower than the gantry reaction peak clearance', () => {
    const [, workY] = zoneLabelAnchor('work');
    expect(workY).toBeLessThan(2.95 + LABEL_CLEARANCE);
  });
});
