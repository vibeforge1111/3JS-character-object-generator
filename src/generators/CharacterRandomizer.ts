/**
 * CharacterRandomizer - Generate random character variations
 * Creates diverse characters by randomizing parameters across all generator types
 */

import * as THREE from 'three';
import type {
  Character,
  CharacterType,
  GenerationParams,
  GeneratorPlugin,
} from '../plugins/types.js';
import { HumanoidGenerator } from './HumanoidGenerator.js';
import { CreatureGenerator } from './CreatureGenerator.js';
import { MonsterGenerator } from './MonsterGenerator.js';
import { MechanicalGenerator } from './MechanicalGenerator.js';

/**
 * Style options for each character type
 */
const STYLE_OPTIONS: Record<CharacterType, string[]> = {
  humanoid: ['realistic', 'stylized', 'chibi', 'robot'],
  creature: ['wolf', 'dragon', 'snake', 'bird', 'fish'],
  monster: ['slime', 'skeleton', 'demon', 'eldritch', 'golem', 'ghost'],
  mechanical: ['humanoid_robot', 'battle_mech', 'spider_bot', 'drone', 'tank_bot', 'wheeled_bot'],
  abstract: ['geometric', 'organic', 'hybrid'],
};

/**
 * Color palettes for randomization
 */
const COLOR_PALETTES = {
  natural: [0x8B4513, 0xD2691E, 0xF5DEB3, 0x228B22, 0x2E8B57],
  fantasy: [0x9400D3, 0x4B0082, 0x00CED1, 0xFF1493, 0xFFD700],
  mechanical: [0x708090, 0x2F4F4F, 0xB8860B, 0xCD853F, 0x8B0000],
  dark: [0x1C1C1C, 0x2C2C2C, 0x3C3C3C, 0x4C4C4C, 0x5C5C5C],
  vibrant: [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF],
  pastel: [0xFFB6C1, 0x98FB98, 0xADD8E6, 0xFFE4E1, 0xE6E6FA],
  earth: [0x8B4513, 0xA0522D, 0xD2B48C, 0x556B2F, 0x6B8E23],
  ocean: [0x006994, 0x40E0D0, 0x7FFFD4, 0x00CED1, 0x20B2AA],
};

/**
 * Randomization options
 */
export interface RandomizerOptions {
  allowedTypes?: CharacterType[] | undefined;
  colorPalette?: keyof typeof COLOR_PALETTES | undefined;
  minDetailLevel?: number | undefined;
  maxDetailLevel?: number | undefined;
  includeAnimations?: boolean | undefined;
  seed?: number | undefined;
}

/**
 * Batch generation options
 */
export interface BatchOptions extends RandomizerOptions {
  count: number;
  ensureVariety?: boolean | undefined;
}

/**
 * Seeded random number generator
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    const item = array[this.nextInt(0, array.length - 1)];
    if (item === undefined) {
      throw new Error('Array is empty');
    }
    return item;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const temp = result[i];
      const jItem = result[j];
      if (temp !== undefined && jItem !== undefined) {
        result[i] = jItem;
        result[j] = temp;
      }
    }
    return result;
  }
}

/**
 * CharacterRandomizer
 * Generates random character variations using all available generators
 */
export class CharacterRandomizer {
  private generators: Map<CharacterType, GeneratorPlugin> = new Map();
  private initialized = false;

  /**
   * Initialize all generators
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    const humanoid = new HumanoidGenerator();
    const creature = new CreatureGenerator();
    const monster = new MonsterGenerator();
    const mechanical = new MechanicalGenerator();

    await Promise.all([
      humanoid.onInit(),
      creature.onInit(),
      monster.onInit(),
      mechanical.onInit(),
    ]);

    this.generators.set('humanoid', humanoid);
    this.generators.set('creature', creature);
    this.generators.set('monster', monster);
    this.generators.set('mechanical', mechanical);

    this.initialized = true;
  }

  /**
   * Generate a single random character
   */
  async generateRandom(options: RandomizerOptions = {}): Promise<Character> {
    if (!this.initialized) {
      await this.init();
    }

    const rng = new SeededRandom(options.seed ?? Date.now());
    const params = this.generateRandomParams(rng, options);
    const generator = this.generators.get(params.type);

    if (!generator) {
      throw new Error(`No generator for type: ${params.type}`);
    }

    const character = await generator.generate(params);

    // Apply random color variations
    if (options.colorPalette && character.model) {
      this.applyColorPalette(character.model, options.colorPalette, rng);
    }

    return character;
  }

  /**
   * Generate a batch of random characters
   */
  async generateBatch(options: BatchOptions): Promise<Character[]> {
    if (!this.initialized) {
      await this.init();
    }

    const characters: Character[] = [];
    const rng = new SeededRandom(options.seed ?? Date.now());

    // Track used combinations for variety
    const usedCombinations = new Set<string>();
    const allowedTypes = options.allowedTypes ?? (['humanoid', 'creature', 'monster', 'mechanical'] as CharacterType[]);

    for (let i = 0; i < options.count; i++) {
      let params: GenerationParams;
      let attempts = 0;
      const maxAttempts = 50;

      do {
        params = this.generateRandomParams(rng, {
          ...options,
          allowedTypes,
        });
        attempts++;
      } while (
        options.ensureVariety &&
        usedCombinations.has(`${params.type}-${params.style}`) &&
        attempts < maxAttempts
      );

      usedCombinations.add(`${params.type}-${params.style}`);

      const generator = this.generators.get(params.type);
      if (!generator) continue;

      const character = await generator.generate(params);

      if (options.colorPalette && character.model) {
        this.applyColorPalette(character.model, options.colorPalette, rng);
      }

      characters.push(character);
    }

    return characters;
  }

  /**
   * Generate random parameters
   */
  private generateRandomParams(rng: SeededRandom, options: RandomizerOptions): GenerationParams {
    const allowedTypes = options.allowedTypes ?? (['humanoid', 'creature', 'monster', 'mechanical'] as CharacterType[]);
    const type = rng.pick(allowedTypes);
    const styles = STYLE_OPTIONS[type];
    const style = styles ? rng.pick(styles) : 'default';

    const minDetail = options.minDetailLevel ?? 0.5;
    const maxDetail = options.maxDetailLevel ?? 1.0;
    const detailLevel = minDetail + rng.next() * (maxDetail - minDetail);

    return {
      type,
      style,
      options: {
        detailLevel,
        textureStyle: rng.next() > 0.5 ? 'stylized' : 'realistic',
        includeAnimations: options.includeAnimations ?? false,
      },
    };
  }

  /**
   * Apply color palette to model
   */
  private applyColorPalette(
    model: THREE.Object3D,
    paletteName: keyof typeof COLOR_PALETTES,
    rng: SeededRandom
  ): void {
    const palette = COLOR_PALETTES[paletteName];

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        for (const mat of materials) {
          if (mat instanceof THREE.MeshStandardMaterial) {
            // Randomly select a color from palette
            const color = rng.pick(palette);
            mat.color.setHex(color);

            // Add slight variation
            const hsl = { h: 0, s: 0, l: 0 };
            mat.color.getHSL(hsl);
            hsl.h += (rng.next() - 0.5) * 0.1;
            hsl.s += (rng.next() - 0.5) * 0.2;
            hsl.l += (rng.next() - 0.5) * 0.1;
            mat.color.setHSL(
              Math.max(0, Math.min(1, hsl.h)),
              Math.max(0, Math.min(1, hsl.s)),
              Math.max(0, Math.min(1, hsl.l))
            );
          }
        }
      }
    });
  }

  /**
   * Get available character types
   */
  getAvailableTypes(): CharacterType[] {
    return Array.from(this.generators.keys());
  }

  /**
   * Get available styles for a type
   */
  getStylesForType(type: CharacterType): string[] {
    return STYLE_OPTIONS[type] ?? [];
  }

  /**
   * Get available color palettes
   */
  getColorPalettes(): string[] {
    return Object.keys(COLOR_PALETTES);
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    for (const generator of this.generators.values()) {
      await generator.onDestroy();
    }
    this.generators.clear();
    this.initialized = false;
  }
}

// Singleton instance
let globalRandomizer: CharacterRandomizer | null = null;

export function getCharacterRandomizer(): CharacterRandomizer {
  if (!globalRandomizer) {
    globalRandomizer = new CharacterRandomizer();
  }
  return globalRandomizer;
}
