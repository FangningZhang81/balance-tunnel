import * as THREE from 'three';

export class RedCross {
  readonly group = new THREE.Group();
  active = false;
  private material = new THREE.MeshBasicMaterial({ color: 0xff234c, transparent: true, opacity: 0.96 });

  constructor() {
    const geometry = new THREE.BoxGeometry(2.05, 0.34, 0.34);
    const first = new THREE.Mesh(geometry, this.material);
    const second = new THREE.Mesh(geometry, this.material);
    first.rotation.z = Math.PI / 4;
    second.rotation.z = -Math.PI / 4;
    const aura = new THREE.Mesh(
      new THREE.TorusGeometry(1.03, 0.045, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xff3158, transparent: true, opacity: 0.42 }),
    );
    this.group.add(first, second, aura);
    this.group.visible = false;
  }

  activate(x: number, y: number, z: number): void {
    this.active = true;
    this.group.visible = true;
    this.group.position.set(x, y, z);
    this.group.rotation.set(0, 0, Math.random() * Math.PI);
  }

  update(delta: number, speed: number, elapsed: number): void {
    if (!this.active) return;
    this.group.position.z += speed * delta;
    this.group.rotation.z += delta * 0.75;
    this.group.rotation.y += delta * 0.3;
    this.material.opacity = 0.82 + Math.sin(elapsed * 7 + this.group.position.z) * 0.14;
  }

  deactivate(): void {
    this.active = false;
    this.group.visible = false;
  }

  dispose(): void {
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material !== this.material) (object.material as THREE.Material).dispose();
      }
    });
    this.material.dispose();
  }
}
