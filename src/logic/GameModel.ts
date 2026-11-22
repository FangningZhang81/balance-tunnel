import { CONFIG } from '../app/Config';
import { GameState } from '../app/GameState';
import { clamp01 } from './math';

export class GameModel {
  state = GameState.Start;
  score = 0;
  time = 0;
  distance = 0;
  speed = CONFIG.speed.start;
  highScore = 0;

  constructor(highScore = 0) {
    this.highScore = Math.max(0, Math.floor(highScore));
  }

  reset(): void {
    this.score = 0;
    this.time = 0;
    this.distance = 0;
    this.speed = CONFIG.speed.start;
  }

  beginCountdown(): void {
    this.reset();
    this.state = GameState.Countdown;
  }

  beginPlaying(): void {
    this.state = GameState.Playing;
  }

  pause(): void {
    if (this.state === GameState.Playing) this.state = GameState.Paused;
  }

  resume(): void {
    if (this.state === GameState.Paused) this.state = GameState.Playing;
  }

  update(deltaSeconds: number): void {
    if (this.state !== GameState.Playing || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    const dt = Math.min(deltaSeconds, 0.1);
    this.time += dt;
    this.speed = speedAtTime(this.time);
    this.distance += this.speed * dt;
  }

  addScore(value: 1 | 5 | 10): void {
    if (this.state === GameState.Playing) this.score += value;
  }

  endRun(): boolean {
    if (this.state === GameState.GameOver) return false;
    this.state = GameState.GameOver;
    const isNewBest = this.score > this.highScore;
    if (isNewBest) this.highScore = this.score;
    return isNewBest;
  }
}

export function speedAtTime(seconds: number): number {
  const progress = clamp01(seconds / CONFIG.speed.rampSeconds);
  const eased = progress * progress * (3 - 2 * progress);
  return CONFIG.speed.start + (CONFIG.speed.max - CONFIG.speed.start) * eased;
}
