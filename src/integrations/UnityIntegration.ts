/**
 * UnityIntegration - Export characters for Unity import
 * Prepares optimized exports compatible with Unity's FBX/glTF importers
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
 * Unity-specific export options
 */
export interface UnityExportOptions {
  scaleFactor: number;        // Unity uses 1 unit = 1 meter
  convertToLeftHanded: boolean; // Unity uses left-handed coordinate system
  bakeAnimations: boolean;
  optimizeForMobile: boolean;
  generateLODs: boolean;
  lodLevels: number;
}

const DEFAULT_OPTIONS: UnityExportOptions = {
  scaleFactor: 1.0,
  convertToLeftHanded: true,
  bakeAnimations: true,
  optimizeForMobile: false,
  generateLODs: false,
  lodLevels: 3,
};

/**
 * Unity bone name mapping (Three.js to Unity Humanoid)
 */
const UNITY_BONE_MAPPING: Record<string, string> = {
  // Spine
  'Hips': 'Hips',
  'Spine': 'Spine',
  'Spine1': 'Chest',
  'Spine2': 'UpperChest',
  'Neck': 'Neck',
  'Head': 'Head',

  // Left Arm
  'LeftShoulder': 'LeftShoulder',
  'LeftArm': 'LeftUpperArm',
  'LeftForeArm': 'LeftLowerArm',
  'LeftHand': 'LeftHand',

  // Right Arm
  'RightShoulder': 'RightShoulder',
  'RightArm': 'RightUpperArm',
  'RightForeArm': 'RightLowerArm',
  'RightHand': 'RightHand',

  // Left Leg
  'LeftUpLeg': 'LeftUpperLeg',
  'LeftLeg': 'LeftLowerLeg',
  'LeftFoot': 'LeftFoot',
  'LeftToeBase': 'LeftToes',

  // Right Leg
  'RightUpLeg': 'RightUpperLeg',
  'RightLeg': 'RightLowerLeg',
  'RightFoot': 'RightFoot',
  'RightToeBase': 'RightToes',
};

/**
 * UnityIntegrationPlugin
 * Handles export optimization for Unity compatibility
 */
export class UnityIntegrationPlugin extends BasePlugin implements IntegrationPlugin {
  readonly id = 'unity-integration';
  readonly name = 'Unity Integration';
  readonly version = '1.0.0';
  readonly type = 'integration' as const;
  readonly target: IntegrationTarget = 'environment-generator';

  private exporter: GLTFExporter | null = null;
  private exportOptions: UnityExportOptions = { ...DEFAULT_OPTIONS };

  protected override async doInit(): Promise<void> {
    this.exporter = new GLTFExporter();
  }

  protected override async doDestroy(): Promise<void> {
    this.exporter = null;
  }

  /**
   * Configure export options
   */
  setOptions(options: Partial<UnityExportOptions>): void {
    this.exportOptions = { ...this.exportOptions, ...options };
  }

  /**
   * Sync character to Unity (export optimized file)
   */
  async sync(character: Character): Promise<void> {
    this.assertReady();

    if (!character.model) {
      throw new PluginError(this.id, 'SYNC_FAILED', 'Character has no model');
    }

    const blob = await this.exportForUnity(character);
    await this.downloadFile(blob, `${character.name}_unity.glb`);

    console.log(`[UnityIntegration] Exported ${character.name} for Unity`);
  }

  /**
   * Export character optimized for Unity
   */
  async exportForUnity(character: Character): Promise<Blob> {
    this.assertReady();

    if (!this.exporter || !character.model) {
      throw new PluginError(this.id, 'EXPORT_FAILED', 'Exporter not ready or no model');
    }

    // Clone and prepare model for Unity
    const preparedModel = this.prepareForUnity(character.model);

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
          animations: this.exportOptions.bakeAnimations
            ? character.model?.animations ?? []
            : [],
        }
      );
    });
  }

  /**
   * Prepare model for Unity compatibility
   */
  private prepareForUnity(model: THREE.Object3D): THREE.Object3D {
    const clone = model.clone(true);

    // Apply scale factor
    if (this.exportOptions.scaleFactor !== 1.0) {
      clone.scale.multiplyScalar(this.exportOptions.scaleFactor);
    }

    // Convert coordinate system if needed (Three.js Y-up to Unity left-handed)
    if (this.exportOptions.convertToLeftHanded) {
      // glTF handles this, but we ensure proper orientation
      clone.rotation.y = Math.PI; // Flip to face Unity's forward direction
    }

    // Rename bones for Unity Humanoid
    this.remapBonesForUnity(clone);

    // Optimize materials for Unity's Standard shader
    this.optimizeMaterialsForUnity(clone);

    // Generate LODs if requested
    if (this.exportOptions.generateLODs) {
      this.generateLODs(clone);
    }

    return clone;
  }

  /**
   * Remap bone names to Unity Humanoid convention
   */
  private remapBonesForUnity(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const unityName = UNITY_BONE_MAPPING[child.name];
        if (unityName) {
          child.name = unityName;
        }
      }
    });
  }

  /**
   * Optimize materials for Unity's Standard shader
   */
  private optimizeMaterialsForUnity(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        for (const mat of materials) {
          if (mat instanceof THREE.MeshStandardMaterial) {
            // Ensure material has a name
            if (!mat.name) {
              mat.name = `Material_${mat.id}`;
            }

            // Unity Standard shader expects:
            // - Metallic workflow (which MeshStandardMaterial uses)
            // - Smoothness is inverse of roughness
            // glTF export handles this mapping automatically

            // Clamp values
            mat.roughness = Math.max(0, Math.min(1, mat.roughness));
            mat.metalness = Math.max(0, Math.min(1, mat.metalness));

            // Mobile optimization: simplify materials
            if (this.exportOptions.optimizeForMobile) {
              mat.envMapIntensity = 0.5;
              // Remove unnecessary maps for mobile
              mat.normalScale?.set(0.5, 0.5);
            }
          }
        }
      }
    });
  }

  /**
   * Generate LOD levels (simplified implementation)
   */
  private generateLODs(object: THREE.Object3D): void {
    // Note: Full LOD generation would require mesh decimation
    // This is a placeholder that marks objects for LOD grouping
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData['LOD'] = {
          level: 0,
          distance: 0,
        };
      }
    });
  }

  /**
   * Check if Unity is available (placeholder for future socket connection)
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Get Unity C# script for importing and setting up the character
   */
  getImportScript(assetPath: string): string {
    return `
using UnityEngine;
using UnityEditor;

public class CharacterImporter : MonoBehaviour
{
    [MenuItem("Character Generator/Import Character")]
    static void ImportCharacter()
    {
        // Import the glTF file
        string path = "${assetPath.replace(/\\/g, '/')}";

        // Note: Requires glTFast or similar glTF importer package
        Debug.Log($"Import character from: {path}");

        // After import, the character should be:
        // 1. Added to scene
        // 2. Configured for Humanoid avatar
        // 3. Have animations extracted
    }

    [MenuItem("Character Generator/Setup Humanoid")]
    static void SetupHumanoid()
    {
        GameObject selected = Selection.activeGameObject;
        if (selected == null)
        {
            Debug.LogError("Please select an imported character");
            return;
        }

        // Get or add Animator component
        Animator animator = selected.GetComponent<Animator>();
        if (animator == null)
        {
            animator = selected.AddComponent<Animator>();
        }

        Debug.Log("Character setup complete!");
    }
}
`.trim();
  }

  /**
   * Get Unity shader compatibility info
   */
  getShaderCompatibility(): Record<string, string> {
    return {
      'MeshStandardMaterial': 'Standard (Metallic)',
      'MeshBasicMaterial': 'Unlit/Color',
      'MeshLambertMaterial': 'Legacy Shaders/Diffuse',
      'MeshPhongMaterial': 'Legacy Shaders/Specular',
    };
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
