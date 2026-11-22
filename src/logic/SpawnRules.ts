import { CONFIG } from '../app/Config';
import { length2 } from './math';

export interface SpawnPoint { x: number; y: number }

export function pointAtRadius(radius: number, angle: number): SpawnPoint {
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

export function bonusPoint(value: 5 | 10, random = Math.random): SpawnPoint {
  const min = value === 5 ? 2.15 : 3.55;
  const max = value === 5 ? 3.35 : 4.55;
  return pointAtRadius(min + (max - min) * random(), random() * Math.PI * 2);
}

export function obstaclePoint(random = Math.random): SpawnPoint {
  const min = CONFIG.spawn.safeCenterRadius + 0.65;
  const max = CONFIG.player.maxRadius - 0.35;
  return pointAtRadius(min + (max - min) * random(), random() * Math.PI * 2);
}

export function isCenterSafe(point: SpawnPoint): boolean {
  return length2(point.x, point.y) >= CONFIG.spawn.safeCenterRadius;
}

export function separated(a: SpawnPoint, b: SpawnPoint, minimum = CONFIG.spawn.minimumSeparation): boolean {
  return length2(a.x - b.x, a.y - b.y) >= minimum;
}

export function obstacleInterval(timeSeconds: number): number {
  const progress = Math.min(1, Math.max(0, timeSeconds / CONFIG.spawn.obstacleDensityRamp));
  return CONFIG.spawn.obstacleStartInterval + (CONFIG.spawn.obstacleMinInterval - CONFIG.spawn.obstacleStartInterval) * progress;
}
