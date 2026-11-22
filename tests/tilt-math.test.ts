import { describe, expect, it } from 'vitest';
import { mapTiltAxis, normalizeScreenAngle, relativeTilt, smoothTilt } from '../src/logic/TiltMath';

describe('tilt math', () => {
  it('applies dead zone, scaling and clamps', () => {
    expect(mapTiltAxis(1, 2, 15)).toBe(0);
    expect(mapTiltAxis(15, 2, 15)).toBe(1);
    expect(mapTiltAxis(-30, 2, 15)).toBe(-1);
    expect(mapTiltAxis(Number.NaN, 2, 15)).toBe(0);
  });

  it('maps portrait and landscape sensor axes', () => {
    const neutral = { beta: 10, gamma: 5, screenAngle: 0 };
    expect(relativeTilt({ beta: 13, gamma: 7, screenAngle: 0 }, neutral)).toEqual({ x: 2, y: -3 });
    expect(relativeTilt({ beta: 13, gamma: 7, screenAngle: 90 }, { ...neutral, screenAngle: 90 })).toEqual({ x: 3, y: 2 });
    expect(relativeTilt({ beta: 13, gamma: 7, screenAngle: -90 }, { ...neutral, screenAngle: -90 })).toEqual({ x: -3, y: -2 });
  });

  it('normalizes screen angles and smooths without overshoot', () => {
    expect(normalizeScreenAngle(270)).toBe(-90);
    expect(normalizeScreenAngle(91)).toBe(90);
    const next = smoothTilt({ x: 0, y: 0 }, { x: 1, y: -1 }, 0.016, 0.11);
    expect(next.x).toBeGreaterThan(0);
    expect(next.x).toBeLessThan(1);
    expect(next.y).toBeLessThan(0);
  });
});
