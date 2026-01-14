/**
 * OBJExporterPlugin - Export characters to Wavefront OBJ format
 * Simple mesh export without animations (OBJ doesn't support them)
 */

import { OBJExporter as ThreeOBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
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
 * OBJExporterPlugin
 * Exports characters to Wavefront OBJ format
 * Note: OBJ is geometry-only, no animations or materials embedded
 */
export class OBJExporterPlugin extends BasePlugin implements ExporterPlugin {
  readonly id = 'obj-exporter';
  readonly name = 'OBJ Exporter';
  readonly version = '1.0.0';
  readonly type = 'exporter' as const;

  private exporter: ThreeOBJExporter | null = null;

  protected override async doInit(): Promise<void> {
    this.exporter = new ThreeOBJExporter();
  }

  protected override async doDestroy(): Promise<void> {
    this.exporter = null;
  }

  async export(character: Character, options: ExportOptions): Promise<Blob | string> {
    this.assertReady();

    if (!this.exporter) {
      throw new PluginError(this.id, 'EXPORT_FAILED', 'Exporter not initialized');
    }

    if (!character.model) {
      throw new PluginError(this.id, 'EXPORT_FAILED', 'Character has no model to export');
    }

    if (options.format !== 'obj') {
      throw new PluginError(this.id, 'EXPORT_FAILED', `Unsupported format: ${options.format}`);
    }

    return this.performExport(character.model);
  }

  private performExport(model: Object3D): string {
    if (!this.exporter) {
      throw new PluginError(this.id, 'EXPORT_FAILED', 'Exporter not available');
    }

    const result = this.exporter.parse(model);
    return result;
  }

  getSupportedFormats(): ExportFormat[] {
    return ['obj'];
  }

  /**
   * Export to downloadable file
   */
  async exportToFile(character: Character, filename: string, options: ExportOptions): Promise<void> {
    const result = await this.export(character, options);
    const blob = new Blob([result], { type: 'text/plain' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
