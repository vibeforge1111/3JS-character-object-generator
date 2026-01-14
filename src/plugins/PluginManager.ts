/**
 * PluginManager - Central registry and lifecycle manager for plugins
 * Following H70 api-design patterns:
 * - Clear lifecycle management
 * - Type-safe plugin access
 * - Proper error handling with context
 */

import type {
  Plugin,
  PluginType,
  PluginInfo,
  GeneratorPlugin,
  ProcessorPlugin,
  ExporterPlugin,
  IntegrationPlugin,
  CharacterType,
  ExportFormat,
  IntegrationTarget,
} from './types.js';
import { PluginError } from './types.js';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private initializationOrder: string[] = [];

  /**
   * Register a plugin with the manager
   * @throws PluginError if plugin is already registered
   */
  async register(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new PluginError(
        plugin.id,
        'ALREADY_REGISTERED',
        `Plugin "${plugin.id}" is already registered`
      );
    }

    // Initialize the plugin
    try {
      await plugin.onInit();
      this.plugins.set(plugin.id, plugin);
      this.initializationOrder.push(plugin.id);
      console.log(`[PluginManager] Registered plugin: ${plugin.name} (${plugin.id})`);
    } catch (error) {
      throw new PluginError(
        plugin.id,
        'INIT_FAILED',
        `Failed to initialize plugin "${plugin.id}"`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Unregister and destroy a plugin
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new PluginError(pluginId, 'NOT_FOUND', `Plugin "${pluginId}" not found`);
    }

    try {
      await plugin.onDestroy();
      this.plugins.delete(pluginId);
      this.initializationOrder = this.initializationOrder.filter(id => id !== pluginId);
      console.log(`[PluginManager] Unregistered plugin: ${pluginId}`);
    } catch (error) {
      console.error(`[PluginManager] Error destroying plugin ${pluginId}:`, error);
      // Still remove from registry
      this.plugins.delete(pluginId);
      this.initializationOrder = this.initializationOrder.filter(id => id !== pluginId);
    }
  }

  /**
   * Get a plugin by ID
   */
  get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get a plugin by ID with type assertion
   * @throws PluginError if plugin not found
   */
  getOrThrow(pluginId: string): Plugin {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new PluginError(pluginId, 'NOT_FOUND', `Plugin "${pluginId}" not found`);
    }
    return plugin;
  }

  /**
   * Get all plugins of a specific type
   */
  getByType<T extends PluginType>(type: T): Array<Plugin & { type: T }> {
    const result: Array<Plugin & { type: T }> = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.type === type) {
        result.push(plugin as Plugin & { type: T });
      }
    }
    return result;
  }

  /**
   * Get all generator plugins
   */
  getGenerators(): GeneratorPlugin[] {
    return this.getByType('generator') as GeneratorPlugin[];
  }

  /**
   * Get all processor plugins
   */
  getProcessors(): ProcessorPlugin[] {
    return this.getByType('processor') as ProcessorPlugin[];
  }

  /**
   * Get all exporter plugins
   */
  getExporters(): ExporterPlugin[] {
    return this.getByType('exporter') as ExporterPlugin[];
  }

  /**
   * Get all integration plugins
   */
  getIntegrations(): IntegrationPlugin[] {
    return this.getByType('integration') as IntegrationPlugin[];
  }

  /**
   * Find a generator that supports the given character type
   */
  findGeneratorFor(characterType: CharacterType): GeneratorPlugin | undefined {
    for (const generator of this.getGenerators()) {
      if (generator.getSupportedTypes().includes(characterType)) {
        return generator;
      }
    }
    return undefined;
  }

  /**
   * Find an exporter that supports the given format
   */
  findExporterFor(format: ExportFormat): ExporterPlugin | undefined {
    for (const exporter of this.getExporters()) {
      if (exporter.getSupportedFormats().includes(format)) {
        return exporter;
      }
    }
    return undefined;
  }

  /**
   * Find an integration for the given target
   */
  findIntegrationFor(target: IntegrationTarget): IntegrationPlugin | undefined {
    for (const integration of this.getIntegrations()) {
      if (integration.target === target) {
        return integration;
      }
    }
    return undefined;
  }

  /**
   * Get information about all registered plugins
   */
  listPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      type: plugin.type,
      state: plugin.state,
    }));
  }

  /**
   * Check if a plugin is registered
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get the number of registered plugins
   */
  get count(): number {
    return this.plugins.size;
  }

  /**
   * Destroy all plugins and clear the registry
   * Destroys in reverse order of initialization
   */
  async destroyAll(): Promise<void> {
    // Destroy in reverse order
    const order = [...this.initializationOrder].reverse();

    for (const pluginId of order) {
      try {
        await this.unregister(pluginId);
      } catch (error) {
        console.error(`[PluginManager] Error destroying plugin ${pluginId}:`, error);
      }
    }

    this.plugins.clear();
    this.initializationOrder = [];
    console.log('[PluginManager] All plugins destroyed');
  }
}

// Singleton instance for global access
let globalPluginManager: PluginManager | null = null;

/**
 * Get the global plugin manager instance
 */
export function getPluginManager(): PluginManager {
  if (!globalPluginManager) {
    globalPluginManager = new PluginManager();
  }
  return globalPluginManager;
}

/**
 * Reset the global plugin manager (for testing)
 */
export async function resetPluginManager(): Promise<void> {
  if (globalPluginManager) {
    await globalPluginManager.destroyAll();
    globalPluginManager = null;
  }
}
