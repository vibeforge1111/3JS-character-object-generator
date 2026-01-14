/**
 * PreviewViewport - 3D preview viewport with orbit controls and lighting
 * Following H70 threejs-3d-graphics patterns:
 * - Proper disposal of controls
 * - Camera controls with damping
 * - Lighting presets
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ThreeScene, type ThreeSceneOptions } from '../core/ThreeScene.js';

export interface ViewportOptions extends ThreeSceneOptions {
  enableDamping?: boolean;
  dampingFactor?: number;
  minDistance?: number;
  maxDistance?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

export interface LightingPreset {
  name: string;
  ambient: { color: number; intensity: number };
  directional: { color: number; intensity: number; position: THREE.Vector3 };
  fill?: { color: number; intensity: number; position: THREE.Vector3 };
}

const LIGHTING_PRESETS: Record<string, LightingPreset> = {
  studio: {
    name: 'Studio',
    ambient: { color: 0xffffff, intensity: 0.4 },
    directional: { color: 0xffffff, intensity: 0.8, position: new THREE.Vector3(5, 5, 5) },
    fill: { color: 0x8888ff, intensity: 0.3, position: new THREE.Vector3(-5, 0, -5) },
  },
  outdoor: {
    name: 'Outdoor',
    ambient: { color: 0x87ceeb, intensity: 0.5 },
    directional: { color: 0xfff4e0, intensity: 1.0, position: new THREE.Vector3(10, 10, 5) },
  },
  dramatic: {
    name: 'Dramatic',
    ambient: { color: 0x1a1a2e, intensity: 0.2 },
    directional: { color: 0xff6b35, intensity: 1.2, position: new THREE.Vector3(-5, 8, 2) },
    fill: { color: 0x4a90d9, intensity: 0.4, position: new THREE.Vector3(5, 0, -5) },
  },
  neutral: {
    name: 'Neutral',
    ambient: { color: 0xffffff, intensity: 0.6 },
    directional: { color: 0xffffff, intensity: 0.6, position: new THREE.Vector3(0, 10, 10) },
  },
};

export class PreviewViewport extends ThreeScene {
  private controls: OrbitControls | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;
  private groundPlane: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private currentPreset: string = 'studio';

  constructor(container: HTMLElement, options: ViewportOptions = {}) {
    super(container, options);

    this.setupControls(options);
    this.setupLighting();
    this.setupHelpers();
    this.setupBackground();

    // Setup update callback for controls damping
    this.onUpdate = () => {
      // IMPORTANT: Update controls for damping to work
      if (this.controls) {
        this.controls.update();
      }
    };
  }

  /**
   * Setup orbit controls
   */
  private setupControls(options: ViewportOptions): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Configure controls
    this.controls.enableDamping = options.enableDamping ?? true;
    this.controls.dampingFactor = options.dampingFactor ?? 0.05;
    this.controls.minDistance = options.minDistance ?? 1;
    this.controls.maxDistance = options.maxDistance ?? 50;
    this.controls.autoRotate = options.autoRotate ?? false;
    this.controls.autoRotateSpeed = options.autoRotateSpeed ?? 2;

    // Set target to center
    this.controls.target.set(0, 0, 0);

    // Enable panning
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.5;

    // Smooth zoom
    this.controls.zoomSpeed = 0.8;

    // Limit vertical rotation to prevent flipping
    this.controls.maxPolarAngle = Math.PI * 0.9;
    this.controls.minPolarAngle = Math.PI * 0.1;
  }

  /**
   * Setup default lighting
   */
  private setupLighting(): void {
    this.applyLightingPreset('studio');
  }

  /**
   * Setup visual helpers (grid, ground)
   */
  private setupHelpers(): void {
    // Grid helper
    this.gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    this.gridHelper.position.y = -0.01;
    this.add(this.gridHelper);

    // Optional ground plane (for shadows later)
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = -0.02;
    this.groundPlane.visible = false; // Hidden by default
    this.add(this.groundPlane);
  }

  /**
   * Setup scene background
   */
  private setupBackground(): void {
    this.scene.background = new THREE.Color(0x1a1a1a);
  }

  /**
   * Apply a lighting preset
   */
  applyLightingPreset(presetName: string): void {
    const preset = LIGHTING_PRESETS[presetName];
    if (!preset) {
      console.warn(`Unknown lighting preset: ${presetName}`);
      return;
    }

    // Remove existing lights
    if (this.ambientLight) {
      this.remove(this.ambientLight);
      this.ambientLight.dispose();
    }
    if (this.directionalLight) {
      this.remove(this.directionalLight);
      this.directionalLight.dispose();
    }
    if (this.fillLight) {
      this.remove(this.fillLight);
      this.fillLight.dispose();
    }

    // Create ambient light
    this.ambientLight = new THREE.AmbientLight(preset.ambient.color, preset.ambient.intensity);
    this.add(this.ambientLight);

    // Create main directional light
    this.directionalLight = new THREE.DirectionalLight(
      preset.directional.color,
      preset.directional.intensity
    );
    this.directionalLight.position.copy(preset.directional.position);
    this.add(this.directionalLight);

    // Create fill light if specified
    if (preset.fill) {
      this.fillLight = new THREE.DirectionalLight(preset.fill.color, preset.fill.intensity);
      this.fillLight.position.copy(preset.fill.position);
      this.add(this.fillLight);
    } else {
      this.fillLight = null;
    }

    this.currentPreset = presetName;
  }

  /**
   * Get available lighting presets
   */
  getLightingPresets(): string[] {
    return Object.keys(LIGHTING_PRESETS);
  }

  /**
   * Get current lighting preset
   */
  getCurrentPreset(): string {
    return this.currentPreset;
  }

  /**
   * Toggle grid visibility
   */
  setGridVisible(visible: boolean): void {
    if (this.gridHelper) {
      this.gridHelper.visible = visible;
    }
  }

  /**
   * Toggle ground plane visibility
   */
  setGroundVisible(visible: boolean): void {
    if (this.groundPlane) {
      this.groundPlane.visible = visible;
    }
  }

  /**
   * Set auto-rotate
   */
  setAutoRotate(enabled: boolean, speed?: number): void {
    if (this.controls) {
      this.controls.autoRotate = enabled;
      if (speed !== undefined) {
        this.controls.autoRotateSpeed = speed;
      }
    }
  }

  /**
   * Reset camera to default position
   */
  resetCamera(): void {
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.position.set(3, 2, 3);
    }
    if (this.controls) {
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  /**
   * Focus camera on an object
   */
  focusOn(object: THREE.Object3D, fitOffset: number = 1.5): void {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    if (this.camera instanceof THREE.PerspectiveCamera) {
      const fov = this.camera.fov * (Math.PI / 180);
      const distance = maxDim / (2 * Math.tan(fov / 2)) * fitOffset;

      const direction = new THREE.Vector3()
        .subVectors(this.camera.position, center)
        .normalize();

      this.camera.position.copy(center).addScaledVector(direction, distance);
    }

    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    }
  }

  /**
   * Set background color
   */
  setBackgroundColor(color: number | string): void {
    this.scene.background = new THREE.Color(color);
  }

  /**
   * Dispose all resources
   */
  override dispose(): void {
    // Dispose controls first
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    // Dispose lights
    if (this.ambientLight) {
      this.ambientLight.dispose();
      this.ambientLight = null;
    }
    if (this.directionalLight) {
      this.directionalLight.dispose();
      this.directionalLight = null;
    }
    if (this.fillLight) {
      this.fillLight.dispose();
      this.fillLight = null;
    }

    // Dispose helpers
    if (this.gridHelper) {
      this.gridHelper.dispose();
      this.gridHelper = null;
    }
    if (this.groundPlane) {
      this.groundPlane.geometry.dispose();
      (this.groundPlane.material as THREE.Material).dispose();
      this.groundPlane = null;
    }

    // Call parent dispose
    super.dispose();
  }
}

// Re-export lighting presets for external use
export { LIGHTING_PRESETS };
