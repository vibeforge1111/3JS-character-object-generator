/**
 * ThreeScene - Production-ready Three.js scene management
 * Following H70 threejs-3d-graphics patterns:
 * - Proper disposal to prevent memory leaks
 * - Capped pixel ratio for mobile performance
 * - WebGL context loss handling
 * - Memory-safe object management
 */

import * as THREE from 'three';
import type { Camera, Scene, WebGLRenderer, Object3D } from 'three';
import { disposeObject } from './dispose.js';

export interface ThreeSceneOptions {
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  maxPixelRatio?: number;
}

export interface ThreeSceneState {
  readonly isRunning: boolean;
  readonly isContextLost: boolean;
}

export interface RenderInfo {
  drawCalls: number;
  triangles: number;
  memory: {
    geometries: number;
    textures: number;
  };
}

export class ThreeScene {
  private readonly container: HTMLElement;
  private readonly clock: THREE.Clock;
  private _scene: Scene;
  private _camera: Camera;
  private _renderer: WebGLRenderer;
  private _isRunning: boolean = false;
  private _isContextLost: boolean = false;
  private animationId: number | null = null;

  // Callback for custom update logic
  public onUpdate: ((delta: number) => void) | null = null;

  // Event handlers bound to this instance
  private readonly boundOnResize: () => void;
  private readonly boundOnContextLost: (event: Event) => void;
  private readonly boundOnContextRestored: () => void;

  constructor(container: HTMLElement, options: ThreeSceneOptions = {}) {
    this.container = container;
    this.clock = new THREE.Clock();

    // Initialize scene
    this._scene = new THREE.Scene();

    // Initialize camera with sensible defaults
    this._camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this._camera.position.set(0, 2, 5);

    // Initialize renderer with production settings
    this._renderer = new THREE.WebGLRenderer({
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? false,
      powerPreference: options.powerPreference ?? 'high-performance',
    });

    // CRITICAL: Cap pixel ratio to prevent mobile performance issues
    // From H70: "Cap at 2: Math.min(window.devicePixelRatio, 2)"
    const maxPixelRatio = options.maxPixelRatio ?? 2;
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    this._renderer.setSize(container.clientWidth, container.clientHeight);

    // Modern color management (Three.js r152+)
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1;

    container.appendChild(this._renderer.domElement);

    // Bind event handlers
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnContextLost = this.onContextLost.bind(this);
    this.boundOnContextRestored = this.onContextRestored.bind(this);

    // Setup event listeners
    window.addEventListener('resize', this.boundOnResize);
    this._renderer.domElement.addEventListener('webglcontextlost', this.boundOnContextLost);
    this._renderer.domElement.addEventListener('webglcontextrestored', this.boundOnContextRestored);
  }

  // Getters for read-only access
  get scene(): Scene {
    return this._scene;
  }

  get camera(): Camera {
    return this._camera;
  }

  get renderer(): WebGLRenderer {
    return this._renderer;
  }

  get state(): ThreeSceneState {
    return {
      isRunning: this._isRunning,
      isContextLost: this._isContextLost,
    };
  }

  /**
   * Set a new camera for the scene
   */
  setCamera(camera: Camera): void {
    this._camera = camera;
  }

  /**
   * Handle window resize
   */
  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (this._camera instanceof THREE.PerspectiveCamera) {
      this._camera.aspect = width / height;
      this._camera.updateProjectionMatrix();
    }

    this._renderer.setSize(width, height);
  }

  /**
   * Handle WebGL context loss
   * From H70: "Listen for webglcontextlost/restored. Provide recovery path."
   */
  private onContextLost(event: Event): void {
    event.preventDefault();
    console.error('WebGL context lost - stopping render loop');
    this._isContextLost = true;
    this.stop();
  }

  /**
   * Handle WebGL context restoration
   */
  private onContextRestored(): void {
    console.log('WebGL context restored - resuming render loop');
    this._isContextLost = false;
    this.start();
  }

  /**
   * Main render loop
   */
  private animate(): void {
    if (!this._isRunning) return;

    this.animationId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // Call custom update callback if provided
    if (this.onUpdate) {
      this.onUpdate(delta);
    }

    this._renderer.render(this._scene, this._camera);
  }

  /**
   * Start the render loop
   */
  start(): void {
    if (this._isRunning || this._isContextLost) return;
    this._isRunning = true;
    this.clock.start();
    this.animate();
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    this._isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Render a single frame (for non-animated scenes)
   */
  render(): void {
    this._renderer.render(this._scene, this._camera);
  }

  /**
   * Add an object to the scene
   */
  add(object: Object3D): void {
    this._scene.add(object);
  }

  /**
   * Remove an object from the scene (without disposal)
   */
  remove(object: Object3D): void {
    this._scene.remove(object);
  }

  /**
   * Remove and dispose an object from the scene
   * IMPORTANT: Use this to prevent memory leaks
   */
  removeAndDispose(object: Object3D): void {
    this._scene.remove(object);
    disposeObject(object);
  }

  /**
   * Clear all objects from the scene
   */
  clear(): void {
    while (this._scene.children.length > 0) {
      const child = this._scene.children[0];
      if (child) {
        disposeObject(child);
        this._scene.remove(child);
      }
    }
  }

  /**
   * Dispose all resources and cleanup
   * CRITICAL: Call this when unmounting or destroying the scene
   */
  dispose(): void {
    // Stop animation loop
    this.stop();

    // Remove event listeners
    window.removeEventListener('resize', this.boundOnResize);
    this._renderer.domElement.removeEventListener('webglcontextlost', this.boundOnContextLost);
    this._renderer.domElement.removeEventListener('webglcontextrestored', this.boundOnContextRestored);

    // Dispose scene contents
    this.clear();

    // Dispose renderer
    this._renderer.dispose();

    // Remove canvas from DOM
    if (this._renderer.domElement.parentElement) {
      this._renderer.domElement.parentElement.removeChild(this._renderer.domElement);
    }
  }

  /**
   * Get renderer info for debugging and performance monitoring
   */
  getInfo(): RenderInfo {
    const info = this._renderer.info;
    return {
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      memory: {
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      },
    };
  }
}

// Re-export disposal utilities
export { disposeObject, disposeMaterial } from './dispose.js';
