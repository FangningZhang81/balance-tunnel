import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/app/Config';
import { bonusPoint, isCenterSafe, obstacleInterval, obstaclePoint, separated } from '../src/logic/SpawnRules';

describe('spawn rules', () => {
  it('keeps every obstacle outside the guaranteed center route', () => {
    for (let i = 0; i <= 100; i++) {
      const point = obstaclePoint(() => i / 100);
      expect(isCenterSafe(point)).toBe(true);
    }
  });

  it('places ten-point balls farther out than five-point balls', () => {
    const five = bonusPoint(5, () => 0);
    const ten = bonusPoint(10, () => 0);
    expect(Math.hypot(ten.x, ten.y)).toBeGreaterThan(Math.hypot(five.x, five.y));
  });

  it('detects separation and caps obstacle density', () => {
    expect(separated({ x: 0, y: 0 }, { x: 2, y: 0 })).toBe(true);
    expect(separated({ x: 0, y: 0 }, { x: 0.2, y: 0.1 })).toBe(false);
    expect(obstacleInterval(0)).toBe(CONFIG.spawn.obstacleStartInterval);
    expect(obstacleInterval(10_000)).toBe(CONFIG.spawn.obstacleMinInterval);
  });
});
