/**
 * Materials system exports
 */

export {
  MaterialLibrary,
  getMaterialLibrary,
  resetMaterialLibrary,
  MATERIAL_PRESETS,
} from './MaterialLibrary.js';
export type {
  MaterialPreset,
  MaterialCategory,
  MaterialConfig,
} from './MaterialLibrary.js';

export {
  TextureGenerator,
  getTextureGenerator,
  resetTextureGenerator,
} from './TextureGenerator.js';
export type {
  TextureType,
  TextureConfig,
  TexturePattern,
  NoiseConfig,
} from './TextureGenerator.js';
