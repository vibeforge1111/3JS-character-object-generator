/**
 * MaterialLibrary - Centralized material management with presets
 * Following H70 threejs-3d-graphics patterns:
 * - Proper material disposal
 * - Shared materials for performance
 * - PBR workflow support
 */

import * as THREE from 'three';

/**
 * Material preset definition
 */
export interface MaterialPreset {
  name: string;
  category: MaterialCategory;
  config: MaterialConfig;
}

export type MaterialCategory = 'skin' | 'metal' | 'fabric' | 'organic' | 'stone' | 'energy' | 'custom';

export interface MaterialConfig {
  color: number;
  roughness: number;
  metalness: number;
  emissive?: number;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  flatShading?: boolean;
  wireframe?: boolean;
}

/**
 * Built-in material presets
 */
const MATERIAL_PRESETS: Record<string, MaterialPreset> = {
  // Skin materials
  skin_light: {
    name: 'Light Skin',
    category: 'skin',
    config: { color: 0xffe4c4, roughness: 0.7, metalness: 0.0 },
  },
  skin_medium: {
    name: 'Medium Skin',
    category: 'skin',
    config: { color: 0xd4a574, roughness: 0.7, metalness: 0.0 },
  },
  skin_dark: {
    name: 'Dark Skin',
    category: 'skin',
    config: { color: 0x8b4513, roughness: 0.7, metalness: 0.0 },
  },
  skin_fantasy: {
    name: 'Fantasy Skin (Blue)',
    category: 'skin',
    config: { color: 0x6495ed, roughness: 0.6, metalness: 0.1 },
  },

  // Metal materials
  steel: {
    name: 'Steel',
    category: 'metal',
    config: { color: 0xc0c0c0, roughness: 0.3, metalness: 0.9 },
  },
  gold: {
    name: 'Gold',
    category: 'metal',
    config: { color: 0xffd700, roughness: 0.2, metalness: 0.95 },
  },
  bronze: {
    name: 'Bronze',
    category: 'metal',
    config: { color: 0xcd7f32, roughness: 0.4, metalness: 0.85 },
  },
  copper: {
    name: 'Copper',
    category: 'metal',
    config: { color: 0xb87333, roughness: 0.35, metalness: 0.9 },
  },
  chrome: {
    name: 'Chrome',
    category: 'metal',
    config: { color: 0xe8e8e8, roughness: 0.1, metalness: 0.98 },
  },
  rusted: {
    name: 'Rusted Metal',
    category: 'metal',
    config: { color: 0x8b4513, roughness: 0.9, metalness: 0.4 },
  },

  // Fabric materials
  cloth_rough: {
    name: 'Rough Cloth',
    category: 'fabric',
    config: { color: 0x8b7355, roughness: 0.95, metalness: 0.0 },
  },
  cloth_smooth: {
    name: 'Smooth Cloth',
    category: 'fabric',
    config: { color: 0x4169e1, roughness: 0.7, metalness: 0.0 },
  },
  leather: {
    name: 'Leather',
    category: 'fabric',
    config: { color: 0x654321, roughness: 0.8, metalness: 0.05 },
  },
  silk: {
    name: 'Silk',
    category: 'fabric',
    config: { color: 0xf5f5dc, roughness: 0.3, metalness: 0.1 },
  },

  // Organic materials
  bone: {
    name: 'Bone',
    category: 'organic',
    config: { color: 0xf5f5dc, roughness: 0.85, metalness: 0.0 },
  },
  scales: {
    name: 'Scales',
    category: 'organic',
    config: { color: 0x228b22, roughness: 0.5, metalness: 0.2 },
  },
  chitin: {
    name: 'Chitin',
    category: 'organic',
    config: { color: 0x2f4f4f, roughness: 0.4, metalness: 0.3 },
  },
  slime: {
    name: 'Slime',
    category: 'organic',
    config: { color: 0x00ff00, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.8 },
  },

  // Stone materials
  stone_gray: {
    name: 'Gray Stone',
    category: 'stone',
    config: { color: 0x808080, roughness: 0.95, metalness: 0.0 },
  },
  marble: {
    name: 'Marble',
    category: 'stone',
    config: { color: 0xfaf0e6, roughness: 0.3, metalness: 0.1 },
  },
  obsidian: {
    name: 'Obsidian',
    category: 'stone',
    config: { color: 0x1a1a2e, roughness: 0.2, metalness: 0.3 },
  },

  // Energy/magic materials
  energy_blue: {
    name: 'Blue Energy',
    category: 'energy',
    config: { color: 0x00ffff, roughness: 0.0, metalness: 0.0, emissive: 0x00ffff, emissiveIntensity: 1.0 },
  },
  energy_red: {
    name: 'Red Energy',
    category: 'energy',
    config: { color: 0xff0000, roughness: 0.0, metalness: 0.0, emissive: 0xff0000, emissiveIntensity: 1.0 },
  },
  energy_green: {
    name: 'Green Energy',
    category: 'energy',
    config: { color: 0x00ff00, roughness: 0.0, metalness: 0.0, emissive: 0x00ff00, emissiveIntensity: 1.0 },
  },
  ghost: {
    name: 'Ghostly',
    category: 'energy',
    config: { color: 0xadd8e6, roughness: 0.0, metalness: 0.0, emissive: 0x4488ff, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 },
  },
};

/**
 * MaterialLibrary - Manages material creation and caching
 */
export class MaterialLibrary {
  private materials: Map<string, THREE.Material> = new Map();
  private customPresets: Map<string, MaterialPreset> = new Map();

  /**
   * Get or create a material from a preset
   */
  get(presetName: string): THREE.MeshStandardMaterial | null {
    // Check cache first
    const cached = this.materials.get(presetName);
    if (cached) {
      return cached as THREE.MeshStandardMaterial;
    }

    // Look up preset
    const preset = MATERIAL_PRESETS[presetName] ?? this.customPresets.get(presetName);
    if (!preset) {
      console.warn(`Material preset not found: ${presetName}`);
      return null;
    }

    // Create material
    const material = this.createFromConfig(preset.config);
    material.name = presetName;
    this.materials.set(presetName, material);

    return material;
  }

  /**
   * Create a new material instance (not cached)
   */
  create(presetName: string): THREE.MeshStandardMaterial | null {
    const preset = MATERIAL_PRESETS[presetName] ?? this.customPresets.get(presetName);
    if (!preset) {
      console.warn(`Material preset not found: ${presetName}`);
      return null;
    }

    return this.createFromConfig(preset.config);
  }

  /**
   * Create material from config
   */
  createFromConfig(config: MaterialConfig): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: config.roughness,
      metalness: config.metalness,
      emissive: config.emissive ?? 0x000000,
      emissiveIntensity: config.emissiveIntensity ?? 0,
      transparent: config.transparent ?? false,
      opacity: config.opacity ?? 1.0,
      side: config.side ?? THREE.FrontSide,
      flatShading: config.flatShading ?? false,
      wireframe: config.wireframe ?? false,
    });
  }

  /**
   * Register a custom preset
   */
  registerPreset(id: string, preset: MaterialPreset): void {
    this.customPresets.set(id, preset);
  }

  /**
   * Get all available preset names
   */
  getPresetNames(): string[] {
    return [
      ...Object.keys(MATERIAL_PRESETS),
      ...Array.from(this.customPresets.keys()),
    ];
  }

  /**
   * Get presets by category
   */
  getPresetsByCategory(category: MaterialCategory): string[] {
    const result: string[] = [];

    for (const [name, preset] of Object.entries(MATERIAL_PRESETS)) {
      if (preset.category === category) {
        result.push(name);
      }
    }

    for (const [name, preset] of this.customPresets) {
      if (preset.category === category) {
        result.push(name);
      }
    }

    return result;
  }

  /**
   * Get all categories
   */
  getCategories(): MaterialCategory[] {
    return ['skin', 'metal', 'fabric', 'organic', 'stone', 'energy', 'custom'];
  }

  /**
   * Clone a material with modifications
   */
  cloneWithModifications(
    sourceName: string,
    modifications: Partial<MaterialConfig>
  ): THREE.MeshStandardMaterial | null {
    const source = this.get(sourceName);
    if (!source) return null;

    const cloned = source.clone();

    if (modifications.color !== undefined) {
      cloned.color.setHex(modifications.color);
    }
    if (modifications.roughness !== undefined) {
      cloned.roughness = modifications.roughness;
    }
    if (modifications.metalness !== undefined) {
      cloned.metalness = modifications.metalness;
    }
    if (modifications.emissive !== undefined) {
      cloned.emissive.setHex(modifications.emissive);
    }
    if (modifications.emissiveIntensity !== undefined) {
      cloned.emissiveIntensity = modifications.emissiveIntensity;
    }
    if (modifications.transparent !== undefined) {
      cloned.transparent = modifications.transparent;
    }
    if (modifications.opacity !== undefined) {
      cloned.opacity = modifications.opacity;
    }

    return cloned;
  }

  /**
   * Dispose all cached materials
   */
  dispose(): void {
    for (const material of this.materials.values()) {
      material.dispose();
    }
    this.materials.clear();
  }

  /**
   * Dispose a specific material
   */
  disposeMaterial(name: string): void {
    const material = this.materials.get(name);
    if (material) {
      material.dispose();
      this.materials.delete(name);
    }
  }
}

// Singleton instance
let globalMaterialLibrary: MaterialLibrary | null = null;

/**
 * Get the global material library instance
 */
export function getMaterialLibrary(): MaterialLibrary {
  if (!globalMaterialLibrary) {
    globalMaterialLibrary = new MaterialLibrary();
  }
  return globalMaterialLibrary;
}

/**
 * Reset the material library (for cleanup)
 */
export function resetMaterialLibrary(): void {
  if (globalMaterialLibrary) {
    globalMaterialLibrary.dispose();
    globalMaterialLibrary = null;
  }
}

// Export presets for reference
export { MATERIAL_PRESETS };
