import * as THREE from 'three';
import { CONFIG } from '../app/Config';
import type { AudioEngine } from '../audio/AudioEngine';
import type { TiltVector } from '../logic/TiltMath';
import { Player } from './Player';
import { SpawnManager } from './SpawnManager';
import { Tunnel } from './Tunnel';

export interface GameCallbacks {
  onScore(value: 1 | 5 | 10): void;
  onCrash(): void;
}

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(64, 1, 0.1, 180);
  private tunnel = new Tunnel();
  private player = new Player();
  private spawns = new SpawnManager();
  private callbacks: GameCallbacks;
  private audio: AudioEngine;
  private running = false;
  private elapsed = 0;
  private webglLost = false;
  private readonly resizeObserver: ResizeObserver;

  constructor(canvas: HTMLCanvasElement, audio: AudioEngine, callbacks: GameCallbacks) {
    this.audio = audio;
    this.callbacks = callbacks;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.render.maxPixelRatio));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.background = new THREE.Color(0x03050e);
    this.scene.fog = new THREE.FogExp2(0x050716, 0.018);
    this.camera.position.set(0, 0, 7.5);
    this.camera.lookAt(0, 0, -20);
    this.scene.add(this.tunnel.group, this.spawns.group, this.player.group);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
    this.resize();
    this.render();
  }

  reset(): void {
    this.elapsed = 0;
    this.player.reset();
    this.spawns.reset();
    this.running = false;
    this.render();
  }

  setRunning(running: boolean): void { this.running = running; }

  update(delta: number, speed: number, tilt: TiltVector): void {
    const dt = Math.min(Math.max(delta, 0), 0.1);
    if (!this.running || this.webglLost) {
      this.render();
      return;
    }
    this.elapsed += dt;
    const energy = this.audio.energy();
    this.tunnel.update(dt, speed, energy, this.elapsed);
    this.player.update(dt, tilt, energy, this.elapsed);
    this.spawns.update(dt, speed, this.elapsed);
    const result = this.spawns.collisions(this.player.position);
    result.scores.forEach((value) => this.callbacks.onScore(value));
    if (result.hitObstacle) this.callbacks.onCrash();
    const shake = result.hitObstacle ? 0.16 : 0;
    this.camera.position.x = this.player.position.x * 0.055 + (Math.random() - 0.5) * shake;
    this.camera.position.y = this.player.position.y * 0.055 + (Math.random() - 0.5) * shake;
    this.render();
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.tunnel.dispose();
    this.player.dispose();
    this.spawns.dispose();
    this.renderer.dispose();
  }

  private resize(): void {
    const parent = this.renderer.domElement.parentElement;
    const width = Math.max(1, parent?.clientWidth ?? window.innerWidth);
    const height = Math.max(1, parent?.clientHeight ?? window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.render();
  }

  private render(): void { if (!this.webglLost) this.renderer.render(this.scene, this.camera); }
  private onContextLost = (event: Event): void => { event.preventDefault(); this.webglLost = true; };
  private onContextRestored = (): void => { this.webglLost = false; this.render(); };
}
