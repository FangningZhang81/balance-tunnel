import * as THREE from 'three';
import { CONFIG } from '../app/Config';
import { length2, smoothFactor } from '../logic/math';
import type { TiltVector } from '../logic/TiltMath';

export class Player {
  readonly group = new THREE.Group();
  readonly position = new THREE.Vector2();
  private target = new THREE.Vector2();
  private coreMaterial = new THREE.MeshBasicMaterial({ color: 0xd8ffff });
  private ringMaterial = new THREE.MeshBasicMaterial({ color: 0x30f4e5, transparent: true, opacity: 0.72 });
  private halo: THREE.Mesh;

  constructor() {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.33, 1), this.coreMaterial);
    this.halo = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.045, 8, 32), this.ringMaterial);
    this.halo.rotation.x = Math.PI / 2;
    this.group.add(core, this.halo);
    this.group.position.z = CONFIG.player.z;
  }

  update(delta: number, tilt: TiltVector, energy: number, elapsed: number): void {
    this.target.set(tilt.x * CONFIG.player.maxRadius, tilt.y * CONFIG.player.maxRadius);
    const magnitude = this.target.length();
    if (magnitude > CONFIG.player.maxRadius) this.target.multiplyScalar(CONFIG.player.maxRadius / magnitude);
    const factor = smoothFactor(delta, 1 / CONFIG.player.response);
    this.position.lerp(this.target, factor);
    if (length2(this.position.x, this.position.y) > CONFIG.player.maxRadius) this.position.setLength(CONFIG.player.maxRadius);
    this.group.position.x = this.position.x;
    this.group.position.y = this.position.y;
    this.group.rotation.z = -tilt.x * 0.28;
    this.group.rotation.x = tilt.y * 0.22;
    const pulse = 1 + energy * 0.16 + Math.sin(elapsed * 5) * 0.025;
    this.halo.scale.setScalar(pulse);
    this.ringMaterial.opacity = 0.54 + energy * 0.4;
  }

  reset(): void {
    this.position.set(0, 0);
    this.target.set(0, 0);
    this.group.position.set(0, 0, CONFIG.player.z);
  }

  dispose(): void {
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    this.coreMaterial.dispose();
    this.ringMaterial.dispose();
  }
}
