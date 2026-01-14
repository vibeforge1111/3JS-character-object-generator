/**
 * Plugin System Types
 * Following H70 api-design patterns:
 * - Clear interfaces with no ambiguity
 * - Discriminated unions for plugin types
 * - Proper error handling patterns
 */

import type { Object3D, BufferGeometry, Material } from 'three';

/**
 * Plugin types - discriminated union for type safety
 */
export type PluginType = 'generator' | 'processor' | 'exporter' | 'integration';

/**
 * Plugin state for lifecycle management
 */
export type PluginState = 'uninitialized' | 'initializing' | 'ready' | 'error' | 'destroyed';

/**
 * Character data structure
 */
export interface Character {
  readonly id: string;
  name: string;
  type: CharacterType;
  model: Object3D | null;
  metadata: CharacterMetadata;
  generationParams: GenerationParams;
}

export type CharacterType = 'humanoid' | 'creature' | 'monster' | 'mechanical' | 'abstract';

export interface CharacterMetadata {
  vertices: number;
  faces: number;
  bones: number;
  materials: number;
  createdAt: Date;
  updatedAt: Date;
  plugins_used: string[];
}

/**
 * Generation parameters for character creation
 */
export interface GenerationParams {
  type: CharacterType;
  style: string;
  prompt?: string;
  seed?: number;
  options: GenerationOptions;
}

export interface GenerationOptions {
  detailLevel: number;
  textureStyle: 'realistic' | 'stylized' | 'pixel' | 'toon';
  includeAnimations: boolean;
  bodyType?: 'humanoid' | 'quadruped' | 'serpentine' | 'amorphous' | 'mechanical';
}

/**
 * Base plugin interface - all plugins must implement this
 */
export interface PluginBase {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly type: PluginType;
  readonly state: PluginState;

  // Lifecycle hooks
  onInit(): Promise<void>;
  onDestroy(): Promise<void>;
}

/**
 * Generator plugin - creates new characters
 */
export interface GeneratorPlugin extends PluginBase {
  readonly type: 'generator';

  /**
   * Generate a new character based on parameters
   */
  generate(params: GenerationParams): Promise<Character>;

  /**
   * Get supported character types
   */
  getSupportedTypes(): CharacterType[];
}

/**
 * Processor plugin - modifies existing characters
 */
export interface ProcessorPlugin extends PluginBase {
  readonly type: 'processor';

  /**
   * Process/modify a character
   */
  process(character: Character, options?: ProcessorOptions): Promise<Character>;
}

export interface ProcessorOptions {
  [key: string]: unknown;
}

/**
 * Export format specification
 */
export type ExportFormat = 'gltf' | 'glb' | 'fbx' | 'obj' | 'blend' | 'vship' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  compress?: boolean;
  embedTextures?: boolean;
  includeAnimations?: boolean;
  includeLOD?: boolean;
  targetPolyCount?: number;
}

/**
 * Exporter plugin - exports characters to various formats
 */
export interface ExporterPlugin extends PluginBase {
  readonly type: 'exporter';

  /**
   * Export character to specified format
   */
  export(character: Character, options: ExportOptions): Promise<Blob | string>;

  /**
   * Get supported export formats
   */
  getSupportedFormats(): ExportFormat[];
}

/**
 * Integration target systems
 */
export type IntegrationTarget = 'environment-generator' | 'agent-orchestrator' | 'unity' | 'godot';

/**
 * Integration plugin - connects to external systems
 */
export interface IntegrationPlugin extends PluginBase {
  readonly type: 'integration';
  readonly target: IntegrationTarget;

  /**
   * Sync character to target system
   */
  sync(character: Character): Promise<void>;

  /**
   * Check if target system is available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Union type of all plugin types
 */
export type Plugin = GeneratorPlugin | ProcessorPlugin | ExporterPlugin | IntegrationPlugin;

/**
 * Plugin registration info
 */
export interface PluginInfo {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly type: PluginType;
  readonly state: PluginState;
  readonly description?: string;
}

/**
 * Plugin error for consistent error handling
 */
export class PluginError extends Error {
  public readonly pluginId: string;
  public readonly code: PluginErrorCode;
  public readonly originalCause: Error | undefined;

  constructor(
    pluginId: string,
    code: PluginErrorCode,
    message: string,
    originalCause?: Error
  ) {
    super(`[${pluginId}] ${message}`, { cause: originalCause });
    this.name = 'PluginError';
    this.pluginId = pluginId;
    this.code = code;
    this.originalCause = originalCause;
  }
}

export type PluginErrorCode =
  | 'INIT_FAILED'
  | 'ALREADY_REGISTERED'
  | 'NOT_FOUND'
  | 'INVALID_STATE'
  | 'GENERATION_FAILED'
  | 'PROCESSING_FAILED'
  | 'EXPORT_FAILED'
  | 'SYNC_FAILED';
