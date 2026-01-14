/**
 * BasePlugin - Abstract base class for plugin implementations
 * Provides common functionality and enforces lifecycle patterns
 */

import type { PluginType, PluginState } from './types.js';

export abstract class BasePlugin {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly type: PluginType;

  private _state: PluginState = 'uninitialized';

  get state(): PluginState {
    return this._state;
  }

  protected setState(state: PluginState): void {
    this._state = state;
  }

  /**
   * Initialize the plugin
   * Override doInit() to provide custom initialization logic
   */
  async onInit(): Promise<void> {
    if (this._state !== 'uninitialized') {
      console.warn(`[${this.id}] Plugin already initialized, state: ${this._state}`);
      return;
    }

    this._state = 'initializing';

    try {
      await this.doInit();
      this._state = 'ready';
      console.log(`[${this.id}] Plugin initialized successfully`);
    } catch (error) {
      this._state = 'error';
      console.error(`[${this.id}] Plugin initialization failed:`, error);
      throw error;
    }
  }

  /**
   * Destroy the plugin
   * Override doDestroy() to provide custom cleanup logic
   */
  async onDestroy(): Promise<void> {
    if (this._state === 'destroyed') {
      return;
    }

    try {
      await this.doDestroy();
    } finally {
      this._state = 'destroyed';
      console.log(`[${this.id}] Plugin destroyed`);
    }
  }

  /**
   * Override this method for custom initialization logic
   */
  protected async doInit(): Promise<void> {
    // Default: no-op
  }

  /**
   * Override this method for custom cleanup logic
   */
  protected async doDestroy(): Promise<void> {
    // Default: no-op
  }

  /**
   * Assert that the plugin is in a ready state
   * @throws Error if plugin is not ready
   */
  protected assertReady(): void {
    if (this._state !== 'ready') {
      throw new Error(`Plugin ${this.id} is not ready (state: ${this._state})`);
    }
  }
}
