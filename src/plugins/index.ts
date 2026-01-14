/**
 * Plugin System exports
 */

// Types
export type {
  Plugin,
  PluginType,
  PluginState,
  PluginInfo,
  PluginBase,
  GeneratorPlugin,
  ProcessorPlugin,
  ExporterPlugin,
  IntegrationPlugin,
  Character,
  CharacterType,
  CharacterMetadata,
  GenerationParams,
  GenerationOptions,
  ProcessorOptions,
  ExportFormat,
  ExportOptions,
  IntegrationTarget,
  PluginErrorCode,
} from './types.js';

export { PluginError } from './types.js';

// Base class for implementations
export { BasePlugin } from './BasePlugin.js';

// Plugin manager
export { PluginManager, getPluginManager, resetPluginManager } from './PluginManager.js';
