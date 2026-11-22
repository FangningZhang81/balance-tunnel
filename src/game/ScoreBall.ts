import * as THREE from 'three';

export type ScoreValue = 1 | 5 | 10;

const BALL_COLORS: Record<ScoreValue, number> = { 1: 0xffffff, 5: 0x2af4e3, 10: 0xffca4f };

function labelTexture(value: ScoreValue): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas labels are unavailable.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '800 52px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineWidth = 9;
  context.strokeStyle = 'rgba(2, 7, 18, .9)';
  context.strokeText(`+${value}`, 96, 48);
  context.fillStyle = value === 10 ? '#281800' : '#04131c';
  context.fillText(`+${value}`, 96, 48);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export class ScoreBall {
  readonly group = new THREE.Group();
  readonly value: ScoreValue;
  active = false;
  private material: THREE.MeshBasicMaterial;
  private labelMaterial: THREE.SpriteMaterial;
  private baseScale: number;

  constructor(value: ScoreValue) {
    this.value = value;
    const color = BALL_COLORS[value];
    this.baseScale = value === 1 ? 0.45 : value === 5 ? 0.55 : 0.64;
    this.material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.88 });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(this.baseScale, 18, 12), this.material);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(this.baseScale * 1.28, 14, 10),
      new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.24 }),
    );
    this.labelMaterial = new THREE.SpriteMaterial({ map: labelTexture(value), transparent: true, depthTest: false });
    const label = new THREE.Sprite(this.labelMaterial);
    label.scale.set(1.35, 0.68, 1);
    label.position.z = 0.5;
    this.group.add(sphere, halo, label);
    this.group.visible = false;
  }

  activate(x: number, y: number, z: number): void {
    this.active = true;
    this.group.visible = true;
    this.group.position.set(x, y, z);
    this.group.scale.setScalar(1);
  }

  update(delta: number, speed: number, elapsed: number): void {
    if (!this.active) return;
    this.group.position.z += speed * delta;
    this.group.rotation.y += delta * 1.2;
    const pulse = 1 + Math.sin(elapsed * 5 + this.group.position.z) * 0.04;
    this.group.scale.setScalar(pulse);
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
    this.labelMaterial.map?.dispose();
    this.labelMaterial.dispose();
  }
}
