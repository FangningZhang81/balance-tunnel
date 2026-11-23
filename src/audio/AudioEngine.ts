import { clamp01 } from '../logic/math';

export class AudioEngine {
  private static readonly PLAYING_GAIN = 0.82;

  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private frequencyData: Uint8Array<ArrayBuffer> | null = null;
  private oscillators: OscillatorNode[] = [];
  private timers: number[] = [];
  private enabled = true;
  private paused = true;
  private smoothedEnergy = 0.15;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  async start(): Promise<void> {
    if (!this.context) this.createGraph();
    if (this.context?.state === 'suspended') await this.context.resume();
    this.paused = false;
    this.applyGain(AudioEngine.PLAYING_GAIN);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.applyGain(paused ? 0 : AudioEngine.PLAYING_GAIN);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.applyGain(this.paused || !enabled ? 0 : AudioEngine.PLAYING_GAIN);
  }

  isEnabled(): boolean { return this.enabled; }

  score(value: 1 | 5 | 10): void {
    if (!this.enabled || !this.context || !this.master) return;
    const notes = value === 1 ? [880] : value === 5 ? [660, 990] : [660, 990, 1320];
    notes.forEach((frequency, index) => this.tone(frequency, 0.06 + index * 0.055, 0.15, value === 10 ? 'triangle' : 'sine', 0.2));
  }

  impact(): void {
    if (!this.enabled || !this.context || !this.master) return;
    this.tone(180, 0, 0.42, 'sawtooth', 0.32, 58);
  }

  energy(): number {
    if (!this.analyser || !this.frequencyData || this.paused || !this.enabled) {
      this.smoothedEnergy += (0.12 - this.smoothedEnergy) * 0.05;
      return this.smoothedEnergy;
    }
    this.analyser.getByteFrequencyData(this.frequencyData);
    const bins = Math.min(28, this.frequencyData.length);
    let sum = 0;
    for (let i = 0; i < bins; i++) sum += this.frequencyData[i];
    const raw = sum / Math.max(1, bins) / 255;
    this.smoothedEnergy += (clamp01(raw * 1.8) - this.smoothedEnergy) * 0.12;
    return this.smoothedEnergy;
  }

  dispose(): void {
    this.timers.forEach((timer) => window.clearInterval(timer));
    this.oscillators.forEach((oscillator) => { try { oscillator.stop(); } catch { /* already stopped */ } });
    void this.context?.close();
    this.context = null;
  }

  private createGraph(): void {
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.84;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 8;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.master.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    // Phone speakers reproduce these fundamentals far better than sub-bass.
    this.continuousOscillator(110, 'sine', 0.16);
    this.continuousOscillator(164.81, 'triangle', 0.07);

    let step = 0;
    const arp = [220, 277.18, 329.63, 415.3, 329.63, 277.18];
    this.timers.push(window.setInterval(() => {
      if (!this.paused && this.enabled) this.tone(arp[step++ % arp.length], 0, 0.18, 'triangle', 0.07);
    }, 360));
    this.timers.push(window.setInterval(() => {
      if (!this.paused && this.enabled) this.tone(145, 0, 0.12, 'sine', 0.19, 72);
    }, 720));
  }

  private continuousOscillator(frequency: number, type: OscillatorType, volume: number): void {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gain.gain.value = volume;
    oscillator.connect(gain).connect(this.master);
    oscillator.start();
    this.oscillators.push(oscillator);
  }

  private tone(frequency: number, delay: number, duration: number, type: OscillatorType, volume: number, endFrequency?: number): void {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  private applyGain(target: number): void {
    if (!this.context || !this.master) return;
    const value = this.enabled ? target : 0;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(value, this.context.currentTime, 0.035);
  }
}
