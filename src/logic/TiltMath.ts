import { clamp, smoothFactor } from './math';

export interface TiltVector { x: number; y: number }
export interface OrientationReading { beta: number; gamma: number; screenAngle: number }

export function relativeTilt(reading: OrientationReading, neutral: OrientationReading): TiltVector {
  const angle = normalizeScreenAngle(reading.screenAngle);
  const beta = reading.beta - neutral.beta;
  const gamma = reading.gamma - neutral.gamma;
  switch (angle) {
    case 90: return { x: beta, y: gamma };
    case -90: return { x: -beta, y: -gamma };
    case 180: return { x: -gamma, y: beta };
    default: return { x: gamma, y: -beta };
  }
}

export function mapTiltAxis(degrees: number, deadZone: number, fullScale: number): number {
  const magnitude = Math.abs(degrees);
  if (!Number.isFinite(degrees) || magnitude <= deadZone) return 0;
  const scaled = (magnitude - deadZone) / Math.max(0.001, fullScale - deadZone);
  return Math.sign(degrees) * clamp(scaled, 0, 1);
}

export function smoothTilt(current: TiltVector, target: TiltVector, deltaSeconds: number, smoothingSeconds: number): TiltVector {
  const factor = smoothFactor(deltaSeconds, smoothingSeconds);
  return {
    x: current.x + (target.x - current.x) * factor,
    y: current.y + (target.y - current.y) * factor,
  };
}

export function normalizeScreenAngle(angle: number): 0 | 90 | -90 | 180 {
  const normalized = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
  if (normalized === 90) return 90;
  if (normalized === 270) return -90;
  if (normalized === 180) return 180;
  return 0;
}
