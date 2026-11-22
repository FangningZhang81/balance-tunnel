export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function smoothFactor(deltaSeconds: number, responseSeconds: number): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0;
  return 1 - Math.exp(-deltaSeconds / Math.max(0.001, responseSeconds));
}

export function length2(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}
