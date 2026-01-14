/**
 * BlenderIntegration - Export characters for Blender import
 * Prepares optimized exports compatible with Blender's glTF importer
 */

import * as THREE from 'three';
import { BasePlugin } from '../plugins/BasePlugin.js';
import { PluginError } from '../plugins/types.js';
import type {
  IntegrationPlugin,
  Character,
  IntegrationTarget,
} from '../plugins/types.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

/**
 * Blender-specific export options
 */
export interface BlenderExportOptions {
  applyModifiers: boolean;
  exportAnimations: boolean;
  exportMaterials: boolean;
  yUp: boolean;  // Blender uses Z-up by default, but glTF is Y-up
  scale: number;
}

const DEFAULT_OPTIONS: BlenderExportOptions = {
  applyModifiers: true,
  exportAnimations: true,
  exportMaterials: true,
  yUp: true,
  scale: 1.0,
};

/**
 * BlenderIntegrationPlugin
 * Handles export optimization for Blender compatibility
 */
export class BlenderIntegrationPlugin extends BasePlugin implements IntegrationPlugin {
  readonly id = 'blender-integration';
  readonly name = 'Blender Integration';
  readonly version = '1.0.0';
  readonly type = 'integration' as const;
  readonly target: IntegrationTarget = 'environment-generator'; // Using closest match

  private exporter: GLTFExporter | null = null;
  private exportOptions: BlenderExportOptions = { ...DEFAULT_OPTIONS };

  protected override async doInit(): Promise<void> {
    this.exporter = new GLTFExporter();
  }

  protected override async doDestroy(): Promise<void> {
    this.exporter = null;
  }

  /**
   * Configure export options
   */
  setOptions(options: Partial<BlenderExportOptions>): void {
    this.exportOptions = { ...this.exportOptions, ...options };
  }

  /**
   * Sync character to Blender (export optimized file)
   */
  async sync(character: Character): Promise<void> {
    this.assertReady();

    if (!character.model) {
      throw new PluginError(this.id, 'SYNC_FAILED', 'Character has no model');
    }

    const blob = await this.exportForBlender(character);
    await this.downloadFile(blob, `${character.name}_blender.glb`);

    console.log(`[BlenderIntegration] Exported ${character.name} for Blender`);
  }

  /**
   * Export character optimized for Blender
   */
  async exportForBlender(character: Character): Promise<Blob> {
    this.assertReady();

    if (!this.exporter || !character.model) {
      throw new PluginError(this.id, 'EXPORT_FAILED', 'Exporter not ready or no model');
    }

    // Clone and prepare model for Blender
    const preparedModel = this.prepareForBlender(character.model);

    return new Promise((resolve, reject) => {
      if (!this.exporter) {
        reject(new PluginError(this.id, 'EXPORT_FAILED', 'Exporter not available'));
        return;
      }

      this.exporter.parse(
        preparedModel,
        (result) => {
          const blob = new Blob([result as ArrayBuffer], {
            type: 'application/octet-stream',
          });
          resolve(blob);
        },
        (error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          reject(new PluginError(this.id, 'EXPORT_FAILED', 'Export failed', err));
        },
        {
          binary: true,
          animations: this.exportOptions.exportAnimations
            ? character.model?.animations ?? []
            : [],
        }
      );
    });
  }

  /**
   * Prepare model for Blender compatibility
   */
  private prepareForBlender(model: THREE.Object3D): THREE.Object3D {
    const clone = model.clone(true);

    // Apply scale
    if (this.exportOptions.scale !== 1.0) {
      clone.scale.multiplyScalar(this.exportOptions.scale);
    }

    // Ensure proper naming for Blender
    this.ensureBlenderNaming(clone);

    // Optimize materials for Blender's PBR workflow
    if (this.exportOptions.exportMaterials) {
      this.optimizeMaterialsForBlender(clone);
    }

    return clone;
  }

  /**
   * Ensure objects have Blender-friendly names
   */
  private ensureBlenderNaming(object: THREE.Object3D): void {
    let meshIndex = 0;
    let boneIndex = 0;

    object.traverse((child) => {
      // Ensure unique names (Blender requires this)
      if (!child.name || child.name === '') {
        if (child instanceof THREE.Mesh) {
          child.name = `Mesh_${meshIndex++}`;
        } else if (child instanceof THREE.Bone) {
          child.name = `Bone_${boneIndex++}`;
        } else {
          child.name = `Object_${child.id}`;
        }
      }

      // Replace spaces and special characters
      child.name = child.name.replace(/[^a-zA-Z0-9_]/g, '_');
    });
  }

  /**
   * Optimize materials for Blender's Principled BSDF
   */
  private optimizeMaterialsForBlender(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        for (const mat of materials) {
          if (mat instanceof THREE.MeshStandardMaterial) {
            // Ensure material name for Blender
            if (!mat.name) {
              mat.name = `Material_${mat.id}`;
            }

            // Clamp values to valid ranges for glTF
            mat.roughness = Math.max(0, Math.min(1, mat.roughness));
            mat.metalness = Math.max(0, Math.min(1, mat.metalness));
          }
        }
      }
    });
  }

  /**
   * Check if Blender socket server is available (for live sync)
   */
  async isAvailable(): Promise<boolean> {
    // In browser environment, we can only export files
    // Live socket connection would require a Blender addon
    return true;
  }

  /**
   * Get Blender Python script for importing
   */
  getImportScript(filepath: string): string {
    return `
import bpy

# Clear existing objects (optional)
# bpy.ops.object.select_all(action='SELECT')
# bpy.ops.object.delete()

# Import the glTF file
bpy.ops.import_scene.gltf(filepath="${filepath.replace(/\\/g, '/')}")

# Select imported objects
for obj in bpy.context.selected_objects:
    obj.select_set(True)

print("Character imported successfully!")
`.trim();
  }

  /**
   * Download file helper
   */
  private async downloadFile(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
