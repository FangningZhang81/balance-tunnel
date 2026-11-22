import { CONFIG } from '../app/Config';
import { mapTiltAxis, normalizeScreenAngle, relativeTilt, smoothTilt, type OrientationReading, type TiltVector } from '../logic/TiltMath';

type PermissionResult = 'granted' | 'denied' | 'unsupported';

interface PermissionAwareEvent {
  requestPermission?: () => Promise<PermissionState>;
}

export class TiltController {
  private reading: OrientationReading | null = null;
  private neutral: OrientationReading | null = null;
  private filtered: TiltVector = { x: 0, y: 0 };
  private lastReadingAt = 0;
  private permission: PermissionResult = 'unsupported';
  private readonly onOrientation = (event: DeviceOrientationEvent): void => {
    if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    this.reading = {
      beta: event.beta as number,
      gamma: event.gamma as number,
      screenAngle: this.screenAngle(),
    };
    this.lastReadingAt = performance.now();
  };

  constructor() {
    if ('DeviceOrientationEvent' in window) {
      this.permission = 'granted';
      window.addEventListener('deviceorientation', this.onOrientation, true);
    }
  }

  async requestPermission(): Promise<PermissionResult> {
    if (!('DeviceOrientationEvent' in window)) {
      this.permission = 'unsupported';
      return this.permission;
    }

    const orientationEvent = DeviceOrientationEvent as unknown as PermissionAwareEvent;
    const motionEvent = DeviceMotionEvent as unknown as PermissionAwareEvent;
    try {
      const permissions: PermissionState[] = [];
      if (typeof orientationEvent.requestPermission === 'function') {
        permissions.push(await orientationEvent.requestPermission());
      }
      if (typeof motionEvent.requestPermission === 'function') {
        permissions.push(await motionEvent.requestPermission());
      }
      this.permission = permissions.every((value) => value === 'granted') ? 'granted' : 'denied';
    } catch {
      this.permission = 'denied';
    }
    return this.permission;
  }

  async waitForReading(timeoutMs = 1800): Promise<boolean> {
    if (this.reading) return true;
    const started = performance.now();
    return new Promise((resolve) => {
      const timer = window.setInterval(() => {
        if (this.reading || performance.now() - started >= timeoutMs) {
          window.clearInterval(timer);
          resolve(Boolean(this.reading));
        }
      }, 40);
    });
  }

  calibrate(): boolean {
    if (!this.reading) return false;
    this.neutral = { ...this.reading };
    this.filtered = { x: 0, y: 0 };
    return true;
  }

  update(deltaSeconds: number): TiltVector {
    if (!this.reading || !this.neutral || !this.isFresh()) {
      this.filtered = smoothTilt(this.filtered, { x: 0, y: 0 }, deltaSeconds, CONFIG.tilt.smoothingSeconds);
      return this.filtered;
    }
    const relative = relativeTilt(this.reading, this.neutral);
    const target = {
      x: mapTiltAxis(relative.x, CONFIG.tilt.deadZoneDegrees, CONFIG.tilt.fullScaleDegrees),
      y: mapTiltAxis(relative.y, CONFIG.tilt.deadZoneDegrees, CONFIG.tilt.fullScaleDegrees),
    };
    this.filtered = smoothTilt(this.filtered, target, deltaSeconds, CONFIG.tilt.smoothingSeconds);
    return this.filtered;
  }

  isFresh(): boolean {
    return this.lastReadingAt > 0 && performance.now() - this.lastReadingAt <= CONFIG.tilt.staleAfterMs;
  }

  isMobileLike(): boolean {
    return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  }

  getPermission(): PermissionResult {
    return this.permission;
  }

  getScreenAngle(): number {
    return this.screenAngle();
  }

  dispose(): void {
    window.removeEventListener('deviceorientation', this.onOrientation, true);
  }

  private screenAngle(): number {
    const legacy = (window as unknown as { orientation?: number }).orientation;
    return normalizeScreenAngle(window.screen.orientation?.angle ?? legacy ?? 0);
  }
}
