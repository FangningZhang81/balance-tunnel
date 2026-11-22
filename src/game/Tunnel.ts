import * as THREE from 'three';
import { CONFIG } from '../app/Config';

export class Tunnel {
  readonly group = new THREE.Group();
  private rings: THREE.Mesh[] = [];
  private materials: THREE.MeshBasicMaterial[] = [];
  private starField: THREE.Points;
  private starPositions: Float32Array;

  constructor() {
    const geometry = new THREE.TorusGeometry(CONFIG.tunnel.radius, 0.035, 6, 64);
    const colors = [0x25f4e6, 0x775dff, 0xe34dff];
    colors.forEach((color) => this.materials.push(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.58 })));
    for (let i = 0; i < CONFIG.tunnel.ringCount; i++) {
      const ring = new THREE.Mesh(geometry, this.materials[i % this.materials.length]);
      ring.position.z = CONFIG.tunnel.nearZ - i * CONFIG.tunnel.ringSpacing;
      ring.rotation.z = i * 0.075;
      this.rings.push(ring);
      this.group.add(ring);
    }

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x193b68, transparent: true, opacity: 0.32 });
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const points = [
        new THREE.Vector3(Math.cos(angle) * CONFIG.tunnel.radius, Math.sin(angle) * CONFIG.tunnel.radius, CONFIG.tunnel.nearZ),
        new THREE.Vector3(Math.cos(angle) * CONFIG.tunnel.radius, Math.sin(angle) * CONFIG.tunnel.radius, CONFIG.tunnel.farZ),
      ];
      this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
    }

    this.starPositions = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) this.resetStar(i, Math.random() * 110 - 100);
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(this.starPositions, 3));
    this.starField = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0x8ffcff, size: 0.035, transparent: true, opacity: 0.62 }));
    this.group.add(this.starField);
  }

  update(delta: number, speed: number, energy: number, elapsed: number): void {
    const totalLength = CONFIG.tunnel.ringCount * CONFIG.tunnel.ringSpacing;
    this.rings.forEach((ring, index) => {
      ring.position.z += speed * delta;
      if (ring.position.z > CONFIG.tunnel.nearZ) ring.position.z -= totalLength;
      ring.rotation.z += delta * (0.06 + index % 3 * 0.015);
      const pulse = 0.42 + energy * 0.48 + Math.sin(elapsed * 2.2 + index * 0.45) * 0.06;
      (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0.2, Math.min(0.92, pulse));
      const scale = 1 + energy * 0.012;
      ring.scale.setScalar(scale);
    });
    for (let i = 0; i < 240; i++) {
      const zIndex = i * 3 + 2;
      this.starPositions[zIndex] += speed * delta * 1.2;
      if (this.starPositions[zIndex] > CONFIG.tunnel.nearZ) this.resetStar(i, CONFIG.tunnel.farZ - Math.random() * 18);
    }
    (this.starField.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.rings[0]?.geometry.dispose();
    this.materials.forEach((material) => material.dispose());
    this.starField.geometry.dispose();
    (this.starField.material as THREE.Material).dispose();
  }

  private resetStar(index: number, z: number): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = 5.25 + Math.random() * 0.55;
    this.starPositions[index * 3] = Math.cos(angle) * radius;
    this.starPositions[index * 3 + 1] = Math.sin(angle) * radius;
    this.starPositions[index * 3 + 2] = z;
  }
}
