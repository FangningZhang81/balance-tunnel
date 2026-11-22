import * as THREE from 'three';
import { CONFIG } from '../app/Config';
import { bonusPoint, obstacleInterval, obstaclePoint, separated, type SpawnPoint } from '../logic/SpawnRules';
import { ScoreBall, type ScoreValue } from './ScoreBall';
import { RedCross } from './RedCross';

export interface CollisionResult {
  scores: ScoreValue[];
  hitObstacle: boolean;
}

export class SpawnManager {
  readonly group = new THREE.Group();
  private balls: ScoreBall[] = [];
  private crosses: RedCross[] = [];
  private whiteTimer = 0;
  private bonusTimer = 0;
  private obstacleTimer = 1.4;
  private recentPoints: Array<SpawnPoint & { z: number }> = [];

  constructor() {
    for (let i = 0; i < 24; i++) this.addBall(1);
    for (let i = 0; i < 9; i++) this.addBall(5);
    for (let i = 0; i < 6; i++) this.addBall(10);
    for (let i = 0; i < 12; i++) {
      const cross = new RedCross();
      this.crosses.push(cross);
      this.group.add(cross.group);
    }
  }

  reset(): void {
    this.whiteTimer = 0;
    this.bonusTimer = 0.8;
    this.obstacleTimer = 1.5;
    this.recentPoints = [];
    this.balls.forEach((ball) => ball.deactivate());
    this.crosses.forEach((cross) => cross.deactivate());
  }

  update(delta: number, speed: number, elapsed: number): void {
    this.whiteTimer -= delta;
    this.bonusTimer -= delta;
    this.obstacleTimer -= delta;
    if (this.whiteTimer <= 0) {
      this.spawnBall(1, { x: 0, y: 0 });
      this.whiteTimer += CONFIG.spawn.whiteInterval;
    }
    if (this.bonusTimer <= 0) {
      const value: 5 | 10 = Math.random() < 0.72 ? 5 : 10;
      this.spawnBall(value, this.findSeparatedPoint(() => bonusPoint(value)));
      this.bonusTimer += CONFIG.spawn.bonusInterval * (0.82 + Math.random() * 0.38);
    }
    if (this.obstacleTimer <= 0) {
      this.spawnCross(this.findSeparatedPoint(() => obstaclePoint()));
      this.obstacleTimer += obstacleInterval(elapsed) * (0.84 + Math.random() * 0.32);
    }

    this.balls.forEach((ball) => {
      ball.update(delta, speed, elapsed);
      if (ball.active && ball.group.position.z > CONFIG.spawn.despawnZ) ball.deactivate();
    });
    this.crosses.forEach((cross) => {
      cross.update(delta, speed, elapsed);
      if (cross.active && cross.group.position.z > CONFIG.spawn.despawnZ) cross.deactivate();
    });
    this.recentPoints = this.recentPoints.filter((point) => point.z + speed * delta < CONFIG.spawn.despawnZ);
    this.recentPoints.forEach((point) => { point.z += speed * delta; });
  }

  collisions(player: THREE.Vector2): CollisionResult {
    const scores: ScoreValue[] = [];
    for (const ball of this.balls) {
      if (!ball.active || Math.abs(ball.group.position.z - CONFIG.player.z) > CONFIG.collision.zWindow) continue;
      const distance = player.distanceTo(new THREE.Vector2(ball.group.position.x, ball.group.position.y));
      if (distance <= CONFIG.player.collisionRadius + CONFIG.collision.ballRadius) {
        scores.push(ball.value);
        ball.deactivate();
      }
    }
    for (const cross of this.crosses) {
      if (!cross.active || Math.abs(cross.group.position.z - CONFIG.player.z) > CONFIG.collision.zWindow) continue;
      const distance = player.distanceTo(new THREE.Vector2(cross.group.position.x, cross.group.position.y));
      if (distance <= CONFIG.player.collisionRadius + CONFIG.collision.crossRadius) return { scores, hitObstacle: true };
    }
    return { scores, hitObstacle: false };
  }

  dispose(): void {
    this.balls.forEach((ball) => ball.dispose());
    this.crosses.forEach((cross) => cross.dispose());
  }

  private addBall(value: ScoreValue): void {
    const ball = new ScoreBall(value);
    this.balls.push(ball);
    this.group.add(ball.group);
  }

  private spawnBall(value: ScoreValue, point: SpawnPoint): void {
    const ball = this.balls.find((candidate) => !candidate.active && candidate.value === value);
    if (!ball) return;
    ball.activate(point.x, point.y, CONFIG.spawn.objectZ);
    this.recentPoints.push({ ...point, z: CONFIG.spawn.objectZ });
  }

  private spawnCross(point: SpawnPoint): void {
    const cross = this.crosses.find((candidate) => !candidate.active);
    if (!cross) return;
    cross.activate(point.x, point.y, CONFIG.spawn.objectZ - 3 - Math.random() * 5);
    this.recentPoints.push({ ...point, z: cross.group.position.z });
  }

  private findSeparatedPoint(factory: () => SpawnPoint): SpawnPoint {
    for (let attempt = 0; attempt < 10; attempt++) {
      const point = factory();
      const conflicts = this.recentPoints.some((other) => Math.abs(other.z - CONFIG.spawn.objectZ) < 5 && !separated(point, other));
      if (!conflicts) return point;
    }
    return factory();
  }
}
