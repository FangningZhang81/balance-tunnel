export const CONFIG = Object.freeze({
  tunnel: {
    radius: 6,
    ringCount: 34,
    ringSpacing: 3.4,
    nearZ: 5,
    farZ: -110,
  },
  player: {
    z: 0,
    maxRadius: 4.6,
    collisionRadius: 0.4,
    response: 8,
  },
  speed: {
    start: 8,
    max: 19,
    rampSeconds: 30,
  },
  tilt: {
    deadZoneDegrees: 2,
    fullScaleDegrees: 15,
    smoothingSeconds: 0.11,
    staleAfterMs: 2200,
  },
  spawn: {
    objectZ: -92,
    despawnZ: 9,
    whiteInterval: 0.62,
    bonusInterval: 1.65,
    obstacleStartInterval: 2.7,
    obstacleMinInterval: 1.35,
    obstacleDensityRamp: 90,
    safeCenterRadius: 1.35,
    minimumSeparation: 1.2,
  },
  collision: {
    zWindow: 0.65,
    ballRadius: 0.58,
    crossRadius: 0.78,
  },
  render: {
    maxPixelRatio: 1.75,
  },
});

export type GameConfig = typeof CONFIG;
