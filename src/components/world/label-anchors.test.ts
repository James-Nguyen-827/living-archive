import { describe, expect, it } from 'vitest';
import { LABEL_CLEARANCE, sculptureTopY, zoneLabelAnchor } from './label-anchors';
import type { ZoneId } from './world-types';

const ZONES: ZoneId[] = ['employment', 'writing', 'projects', 'interests', 'about'];

describe('zone label anchors', () => {
  it('places anchors on the horizontal center of each sculpture', () => {
    expect(zoneLabelAnchor('employment')).toEqual([-7, expect.any(Number), 0]);
    expect(zoneLabelAnchor('writing')[0]).toBe(0);
    expect(zoneLabelAnchor('writing')[2]).toBe(-8);
    expect(zoneLabelAnchor('projects')[0]).toBe(8);
    expect(zoneLabelAnchor('projects')[2]).toBe(-1);
    expect(zoneLabelAnchor('about')[0]).toBe(7);
    expect(zoneLabelAnchor('about')[2]).toBe(8);
    expect(zoneLabelAnchor('interests')[0]).toBe(0);
    expect(zoneLabelAnchor('interests')[2]).toBe(7);
  });

  it('keeps every label a uniform distance above its sculpture top', () => {
    for (const zone of ZONES) {
      const [, anchorY] = zoneLabelAnchor(zone);
      expect(anchorY - sculptureTopY(zone)).toBeCloseTo(LABEL_CLEARANCE, 5);
    }
  });

  it('sits employment lower than the gantry reaction peak clearance', () => {
    const [, employmentY] = zoneLabelAnchor('employment');
    expect(employmentY).toBeLessThan(2.95 + LABEL_CLEARANCE);
  });
});
