/**
 * GLTFExporterPlugin - Export characters to glTF/GLB format
 * Following H70 api-design patterns:
 * - Clear async/await handling
 * - Proper error handling with typed errors
 * - Binary and JSON export options
 */

import { GLTFExporter as ThreeGLTFExporter, type GLTFExporterOptions } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { Object3D } from 'three';
import { BasePlugin } from '../plugins/BasePlugin.js';
import { PluginError } from '../plugins/types.js';
import type {
  ExporterPlugin,
  Character,
  ExportFormat,
  ExportOptions,
} from '../plugins/types.js';

/**
 * Extended export options for glTF
 */
interface GLTFExportConfig {
  binary: boolean;
  onlyVisible: boolean;
  truncateDrawRange: boolean;
  maxTextureSize: number;
}

/**
 * Default glTF export configuration
 */
const DEFAULT_GLTF_CONFIG: GLTFExportConfig = {
  binary: true,
  onlyVisible: true,
  truncateDrawRange: true,
  maxTextureSize: 4096,
};

/**
 * GLTFExporterPlugin
 * Exports characters to glTF 2.0 format (JSON or binary GLB)
 */
export class GLTFExporterPlugin extends BasePlugin implements ExporterPlugin {
  readonly id = 'gltf-exporter';
  readonly name = 'glTF Exporter';
  readonly version = '1.0.0';
  readonly type = 'exporter' as const;

  private exporter: ThreeGLTFExporter | null = null;

  /**
   * Initialize the exporter
   */
  protected override async doInit(): Promise<void> {
    this.exporter = new ThreeGLTFExporter();
  }

  /**
   * Cleanup
   */
  protected override async doDestroy(): Promise<void> {
    this.exporter = null;
  }

  /**
   * Export a character to glTF/GLB format
   */
  async export(character: Character, options: ExportOptions): Promise<Blob | string> {
    this.assertReady();

    if (!this.exporter) {
      throw new PluginError(
        this.id,
        'EXPORT_FAILED',
        'Exporter not initialized'
      );
    }

    if (!character.model) {
      throw new PluginError(
        this.id,
        'EXPORT_FAILED',
        'Character has no model to export'
      );
    }

    // Validate format
    const format = options.format;
    if (format !== 'gltf' && format !== 'glb') {
      throw new PluginError(
        this.id,
        'EXPORT_FAILED',
        `Unsupported format: ${format}. Use 'gltf' or 'glb'.`
      );
    }

    const binary = format === 'glb';

    // Build exporter options
    const exporterOptions: GLTFExporterOptions = {
      binary,
      onlyVisible: DEFAULT_GLTF_CONFIG.onlyVisible,
      truncateDrawRange: DEFAULT_GLTF_CONFIG.truncateDrawRange,
      maxTextureSize: DEFAULT_GLTF_CONFIG.maxTextureSize,
    };

    // Include animations if requested and available
    if (options.includeAnimations) {
      // Note: animations would be attached to character.model.animations
      exporterOptions.animations = character.model.animations ?? [];
    }

    return this.performExport(character.model, exporterOptions, binary);
  }

  /**
   * Perform the actual export using Three.js GLTFExporter
   */
  private performExport(
    model: Object3D,
    options: GLTFExporterOptions,
    binary: boolean
  ): Promise<Blob | string> {
    return new Promise((resolve, reject) => {
      if (!this.exporter) {
        reject(new PluginError(this.id, 'EXPORT_FAILED', 'Exporter not available'));
        return;
      }

      const onComplete = (result: ArrayBuffer | object) => {
        try {
          if (binary) {
            // ArrayBuffer for GLB
            const blob = new Blob([result as ArrayBuffer], {
              type: 'application/octet-stream',
            });
            resolve(blob);
          } else {
            // JSON object for GLTF
            const jsonString = JSON.stringify(result, null, 2);
            resolve(jsonString);
          }
        } catch (error) {
          reject(
            new PluginError(
              this.id,
              'EXPORT_FAILED',
              'Failed to process export result',
              error instanceof Error ? error : undefined
            )
          );
        }
      };

      const onError = (error: unknown) => {
        reject(
          new PluginError(
            this.id,
            'EXPORT_FAILED',
            'glTF export failed',
            error instanceof Error ? error : undefined
          )
        );
      };

      this.exporter.parse(model, onComplete, onError, options);
    });
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): ExportFormat[] {
    return ['gltf', 'glb'];
  }

  /**
   * Export to a downloadable file
   * Utility method for browser environments
   */
  async exportToFile(character: Character, filename: string, options: ExportOptions): Promise<void> {
    const result = await this.export(character, options);

    let blob: Blob;
    if (result instanceof Blob) {
      blob = result;
    } else {
      blob = new Blob([result], { type: 'application/json' });
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);
  }
}
