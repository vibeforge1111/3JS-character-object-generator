/**
 * Disposal utilities for Three.js objects
 * Following H70 threejs-3d-graphics patterns for memory management
 */

import * as THREE from 'three';
import type { Object3D, Material, Texture } from 'three';

/**
 * Dispose a material and all its textures
 */
export function disposeMaterial(material: Material): void {
  // Dispose all texture properties
  const keys = Object.keys(material) as Array<keyof Material>;
  for (const key of keys) {
    const value = material[key];
    if (value && typeof value === 'object' && 'isTexture' in value) {
      const texture = value as Texture;
      if (texture.isTexture) {
        texture.dispose();
      }
    }
  }
  material.dispose();
}

/**
 * Recursively dispose an object and all its children
 * CRITICAL: Always call this when removing objects from scene
 */
export function disposeObject(object: Object3D): void {
  if (!object) return;

  // Recursively dispose children first
  while (object.children.length > 0) {
    const child = object.children[0];
    if (child) {
      disposeObject(child);
      object.remove(child);
    }
  }

  // Dispose geometry if mesh
  if ('geometry' in object && object.geometry) {
    (object.geometry as THREE.BufferGeometry).dispose();
  }

  // Dispose material(s) if mesh
  if ('material' in object && object.material) {
    const material = object.material;
    if (Array.isArray(material)) {
      material.forEach(m => disposeMaterial(m));
    } else {
      disposeMaterial(material as Material);
    }
  }
}
