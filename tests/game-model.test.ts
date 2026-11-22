import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/app/Config';
import { GameState } from '../src/app/GameState';
import { GameModel, speedAtTime } from '../src/logic/GameModel';

describe('GameModel', () => {
  it('tracks score, active time and integrated distance only while playing', () => {
    const model = new GameModel();
    model.beginCountdown();
    model.update(1);
    expect(model.time).toBe(0);
    model.beginPlaying();
    model.update(0.1);
    model.addScore(5);
    expect(model.score).toBe(5);
    expect(model.time).toBeCloseTo(0.1);
    expect(model.distance).toBeGreaterThan(0);
    const frozen = model.distance;
    model.pause();
    model.update(1);
    model.addScore(10);
    expect(model.distance).toBe(frozen);
    expect(model.score).toBe(5);
  });

  it('caps frame deltas and speed at the configured maximum', () => {
    const model = new GameModel();
    model.beginPlaying();
    model.update(5);
    expect(model.time).toBeCloseTo(0.1);
    expect(speedAtTime(1_000)).toBe(CONFIG.speed.max);
    expect(speedAtTime(-10)).toBe(CONFIG.speed.start);
  });

  it('updates high score once and ends safely on repeat calls', () => {
    const model = new GameModel(4);
    model.beginPlaying();
    model.addScore(5);
    expect(model.endRun()).toBe(true);
    expect(model.highScore).toBe(5);
    expect(model.state).toBe(GameState.GameOver);
    expect(model.endRun()).toBe(false);
  });

  it('resets a run without erasing the high score', () => {
    const model = new GameModel(25);
    model.beginPlaying();
    model.addScore(10);
    model.beginCountdown();
    expect(model.score).toBe(0);
    expect(model.distance).toBe(0);
    expect(model.highScore).toBe(25);
  });
});
