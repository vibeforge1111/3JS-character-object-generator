/**
 * PresetManager - Save and load character presets
 * Handles serialization of character configurations
 */

import type { Character, GenerationParams, CharacterType } from '../plugins/types.js';

/**
 * Character preset (serializable configuration)
 */
export interface CharacterPreset {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;  // Base64 encoded thumbnail
  createdAt: string;
  updatedAt: string;
  params: GenerationParams;
  customizations?: PresetCustomizations;
}

/**
 * Additional customizations stored with preset
 */
export interface PresetCustomizations {
  materialOverrides?: Record<string, {
    color?: number;
    roughness?: number;
    metalness?: number;
  }>;
  scaleModifiers?: Record<string, number>;
  colorPalette?: number[];
}

/**
 * Preset collection for organizing presets
 */
export interface PresetCollection {
  id: string;
  name: string;
  presets: string[];  // Preset IDs
}

const STORAGE_KEY = 'character-generator-presets';
const COLLECTIONS_KEY = 'character-generator-collections';

/**
 * PresetManager - Manages character preset storage and retrieval
 */
export class PresetManager {
  private presets: Map<string, CharacterPreset> = new Map();
  private collections: Map<string, PresetCollection> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Create a preset from a character
   */
  createPreset(
    character: Character,
    name: string,
    description: string = ''
  ): CharacterPreset {
    const preset: CharacterPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      params: { ...character.generationParams },
    };

    this.presets.set(preset.id, preset);
    this.saveToStorage();

    return preset;
  }

  /**
   * Save preset with thumbnail
   */
  async createPresetWithThumbnail(
    character: Character,
    name: string,
    description: string,
    canvas: HTMLCanvasElement
  ): Promise<CharacterPreset> {
    const preset = this.createPreset(character, name, description);

    // Generate thumbnail
    const thumbnailCanvas = document.createElement('canvas');
    thumbnailCanvas.width = 128;
    thumbnailCanvas.height = 128;
    const ctx = thumbnailCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, 128, 128);
      preset.thumbnail = thumbnailCanvas.toDataURL('image/png');
    }

    this.presets.set(preset.id, preset);
    this.saveToStorage();

    return preset;
  }

  /**
   * Get a preset by ID
   */
  getPreset(id: string): CharacterPreset | undefined {
    return this.presets.get(id);
  }

  /**
   * Get all presets
   */
  getAllPresets(): CharacterPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Get presets by character type
   */
  getPresetsByType(type: CharacterType): CharacterPreset[] {
    return Array.from(this.presets.values()).filter(
      (preset) => preset.params.type === type
    );
  }

  /**
   * Update a preset
   */
  updatePreset(id: string, updates: Partial<CharacterPreset>): CharacterPreset | null {
    const preset = this.presets.get(id);
    if (!preset) return null;

    const updated: CharacterPreset = {
      ...preset,
      ...updates,
      id: preset.id,  // Prevent ID change
      createdAt: preset.createdAt,  // Preserve creation date
      updatedAt: new Date().toISOString(),
    };

    this.presets.set(id, updated);
    this.saveToStorage();

    return updated;
  }

  /**
   * Delete a preset
   */
  deletePreset(id: string): boolean {
    const deleted = this.presets.delete(id);
    if (deleted) {
      // Remove from collections
      for (const collection of this.collections.values()) {
        collection.presets = collection.presets.filter((pid) => pid !== id);
      }
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Create a collection
   */
  createCollection(name: string): PresetCollection {
    const collection: PresetCollection = {
      id: `collection-${Date.now()}`,
      name,
      presets: [],
    };

    this.collections.set(collection.id, collection);
    this.saveToStorage();

    return collection;
  }

  /**
   * Add preset to collection
   */
  addToCollection(collectionId: string, presetId: string): boolean {
    const collection = this.collections.get(collectionId);
    if (!collection || !this.presets.has(presetId)) return false;

    if (!collection.presets.includes(presetId)) {
      collection.presets.push(presetId);
      this.saveToStorage();
    }

    return true;
  }

  /**
   * Get all collections
   */
  getCollections(): PresetCollection[] {
    return Array.from(this.collections.values());
  }

  /**
   * Export presets to JSON
   */
  exportToJSON(): string {
    const data = {
      presets: Array.from(this.presets.values()),
      collections: Array.from(this.collections.values()),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import presets from JSON
   */
  importFromJSON(json: string): { presetsImported: number; collectionsImported: number } {
    try {
      const data = JSON.parse(json) as {
        presets?: CharacterPreset[];
        collections?: PresetCollection[];
      };

      let presetsImported = 0;
      let collectionsImported = 0;

      if (data.presets) {
        for (const preset of data.presets) {
          // Generate new ID to avoid conflicts
          const newPreset = {
            ...preset,
            id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          };
          this.presets.set(newPreset.id, newPreset);
          presetsImported++;
        }
      }

      if (data.collections) {
        for (const collection of data.collections) {
          const newCollection = {
            ...collection,
            id: `collection-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          };
          this.collections.set(newCollection.id, newCollection);
          collectionsImported++;
        }
      }

      this.saveToStorage();

      return { presetsImported, collectionsImported };
    } catch (error) {
      console.error('Failed to import presets:', error);
      return { presetsImported: 0, collectionsImported: 0 };
    }
  }

  /**
   * Search presets
   */
  search(query: string): CharacterPreset[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.presets.values()).filter(
      (preset) =>
        preset.name.toLowerCase().includes(lowerQuery) ||
        preset.description.toLowerCase().includes(lowerQuery) ||
        preset.params.type.toLowerCase().includes(lowerQuery) ||
        preset.params.style?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get built-in starter presets
   */
  getStarterPresets(): CharacterPreset[] {
    return [
      {
        id: 'starter-hero',
        name: 'Fantasy Hero',
        description: 'Stylized humanoid hero character',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        params: {
          type: 'humanoid',
          style: 'stylized',
          options: { detailLevel: 0.8, textureStyle: 'stylized', includeAnimations: true },
        },
      },
      {
        id: 'starter-robot',
        name: 'Combat Robot',
        description: 'Battle-ready mechanical unit',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        params: {
          type: 'mechanical',
          style: 'battle_mech',
          options: { detailLevel: 0.9, textureStyle: 'realistic', includeAnimations: false },
        },
      },
      {
        id: 'starter-dragon',
        name: 'Fire Dragon',
        description: 'Classic dragon creature',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        params: {
          type: 'creature',
          style: 'dragon',
          options: { detailLevel: 0.85, textureStyle: 'stylized', includeAnimations: true },
        },
      },
      {
        id: 'starter-demon',
        name: 'Dark Demon',
        description: 'Fearsome demon monster',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        params: {
          type: 'monster',
          style: 'demon',
          options: { detailLevel: 0.8, textureStyle: 'stylized', includeAnimations: true },
        },
      },
    ];
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const presetsData = JSON.stringify(Array.from(this.presets.entries()));
      const collectionsData = JSON.stringify(Array.from(this.collections.entries()));

      localStorage.setItem(STORAGE_KEY, presetsData);
      localStorage.setItem(COLLECTIONS_KEY, collectionsData);
    } catch (error) {
      console.error('Failed to save presets to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const presetsData = localStorage.getItem(STORAGE_KEY);
      const collectionsData = localStorage.getItem(COLLECTIONS_KEY);

      if (presetsData) {
        const entries = JSON.parse(presetsData) as Array<[string, CharacterPreset]>;
        this.presets = new Map(entries);
      }

      if (collectionsData) {
        const entries = JSON.parse(collectionsData) as Array<[string, PresetCollection]>;
        this.collections = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load presets from storage:', error);
    }
  }

  /**
   * Clear all presets (use with caution)
   */
  clearAll(): void {
    this.presets.clear();
    this.collections.clear();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COLLECTIONS_KEY);
  }
}

// Singleton
let globalPresetManager: PresetManager | null = null;

export function getPresetManager(): PresetManager {
  if (!globalPresetManager) {
    globalPresetManager = new PresetManager();
  }
  return globalPresetManager;
}
