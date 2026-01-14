/**
 * TextureGenerator - Procedural texture generation
 * Creates textures programmatically using canvas
 */

import * as THREE from 'three';

export type TextureType = 'color' | 'normal' | 'roughness' | 'metalness' | 'emissive';

export interface TextureConfig {
  width: number;
  height: number;
  baseColor: number;
  pattern?: TexturePattern;
  noise?: NoiseConfig;
}

export type TexturePattern = 'solid' | 'checker' | 'stripes' | 'gradient' | 'noise' | 'dots' | 'grid';

export interface NoiseConfig {
  scale: number;
  octaves: number;
  persistence: number;
  intensity: number;
}

const DEFAULT_CONFIG: TextureConfig = {
  width: 256,
  height: 256,
  baseColor: 0x808080,
  pattern: 'solid',
};

/**
 * TextureGenerator - Creates procedural textures
 */
export class TextureGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private textures: Map<string, THREE.Texture> = new Map();

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
  }

  /**
   * Generate a texture with the given configuration
   */
  generate(name: string, config: Partial<TextureConfig> = {}): THREE.Texture {
    const fullConfig: TextureConfig = { ...DEFAULT_CONFIG, ...config };

    this.canvas.width = fullConfig.width;
    this.canvas.height = fullConfig.height;

    // Generate pattern
    switch (fullConfig.pattern) {
      case 'checker':
        this.drawChecker(fullConfig);
        break;
      case 'stripes':
        this.drawStripes(fullConfig);
        break;
      case 'gradient':
        this.drawGradient(fullConfig);
        break;
      case 'noise':
        this.drawNoise(fullConfig);
        break;
      case 'dots':
        this.drawDots(fullConfig);
        break;
      case 'grid':
        this.drawGrid(fullConfig);
        break;
      case 'solid':
      default:
        this.drawSolid(fullConfig);
        break;
    }

    // Apply noise overlay if configured
    if (fullConfig.noise && fullConfig.pattern !== 'noise') {
      this.applyNoiseOverlay(fullConfig.noise);
    }

    // Create Three.js texture
    const texture = new THREE.CanvasTexture(this.canvas);
    texture.name = name;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    this.textures.set(name, texture);
    return texture;
  }

  /**
   * Generate a normal map from a height map
   */
  generateNormalMap(name: string, config: Partial<TextureConfig> = {}): THREE.Texture {
    const fullConfig: TextureConfig = { ...DEFAULT_CONFIG, ...config, pattern: 'noise' };

    this.canvas.width = fullConfig.width;
    this.canvas.height = fullConfig.height;

    // First generate a height map using noise
    this.drawNoise(fullConfig);

    // Get height data
    const imageData = this.ctx.getImageData(0, 0, fullConfig.width, fullConfig.height);
    const heightData = imageData.data;

    // Create normal map
    const normalData = this.ctx.createImageData(fullConfig.width, fullConfig.height);

    for (let y = 0; y < fullConfig.height; y++) {
      for (let x = 0; x < fullConfig.width; x++) {
        const idx = (y * fullConfig.width + x) * 4;

        // Sample neighboring heights
        const left = this.getHeight(heightData, x - 1, y, fullConfig.width, fullConfig.height);
        const right = this.getHeight(heightData, x + 1, y, fullConfig.width, fullConfig.height);
        const up = this.getHeight(heightData, x, y - 1, fullConfig.width, fullConfig.height);
        const down = this.getHeight(heightData, x, y + 1, fullConfig.width, fullConfig.height);

        // Calculate normal
        const dx = (left - right) * 0.5;
        const dy = (up - down) * 0.5;
        const dz = 1.0;

        // Normalize
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Convert to RGB (normal map format)
        normalData.data[idx] = Math.floor(((dx / length) * 0.5 + 0.5) * 255);
        normalData.data[idx + 1] = Math.floor(((dy / length) * 0.5 + 0.5) * 255);
        normalData.data[idx + 2] = Math.floor(((dz / length) * 0.5 + 0.5) * 255);
        normalData.data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(normalData, 0, 0);

    const texture = new THREE.CanvasTexture(this.canvas);
    texture.name = `${name}_normal`;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    this.textures.set(`${name}_normal`, texture);
    return texture;
  }

  private getHeight(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): number {
    // Wrap coordinates
    x = ((x % width) + width) % width;
    y = ((y % height) + height) % height;
    const idx = (y * width + x) * 4;
    const val = data[idx];
    return val !== undefined ? val / 255 : 0.5;
  }

  private drawSolid(config: TextureConfig): void {
    this.ctx.fillStyle = `#${config.baseColor.toString(16).padStart(6, '0')}`;
    this.ctx.fillRect(0, 0, config.width, config.height);
  }

  private drawChecker(config: TextureConfig): void {
    const size = 32;
    const color1 = config.baseColor;
    const color2 = this.adjustBrightness(config.baseColor, -0.3);

    for (let y = 0; y < config.height; y += size) {
      for (let x = 0; x < config.width; x += size) {
        const isEven = ((x / size) + (y / size)) % 2 === 0;
        this.ctx.fillStyle = `#${(isEven ? color1 : color2).toString(16).padStart(6, '0')}`;
        this.ctx.fillRect(x, y, size, size);
      }
    }
  }

  private drawStripes(config: TextureConfig): void {
    const stripeWidth = 16;
    const color1 = config.baseColor;
    const color2 = this.adjustBrightness(config.baseColor, -0.2);

    for (let x = 0; x < config.width; x += stripeWidth * 2) {
      this.ctx.fillStyle = `#${color1.toString(16).padStart(6, '0')}`;
      this.ctx.fillRect(x, 0, stripeWidth, config.height);
      this.ctx.fillStyle = `#${color2.toString(16).padStart(6, '0')}`;
      this.ctx.fillRect(x + stripeWidth, 0, stripeWidth, config.height);
    }
  }

  private drawGradient(config: TextureConfig): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, config.height);
    gradient.addColorStop(0, `#${config.baseColor.toString(16).padStart(6, '0')}`);
    gradient.addColorStop(1, `#${this.adjustBrightness(config.baseColor, -0.4).toString(16).padStart(6, '0')}`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, config.width, config.height);
  }

  private drawNoise(config: TextureConfig): void {
    const noiseConfig = config.noise ?? { scale: 0.05, octaves: 4, persistence: 0.5, intensity: 1.0 };
    const imageData = this.ctx.createImageData(config.width, config.height);

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const noise = this.perlinNoise(
          x * noiseConfig.scale,
          y * noiseConfig.scale,
          noiseConfig.octaves,
          noiseConfig.persistence
        );
        const value = Math.floor(((noise + 1) / 2) * 255 * noiseConfig.intensity);
        const idx = (y * config.width + x) * 4;
        imageData.data[idx] = value;
        imageData.data[idx + 1] = value;
        imageData.data[idx + 2] = value;
        imageData.data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  private drawDots(config: TextureConfig): void {
    this.drawSolid(config);

    const dotColor = this.adjustBrightness(config.baseColor, 0.3);
    this.ctx.fillStyle = `#${dotColor.toString(16).padStart(6, '0')}`;

    const spacing = 24;
    const radius = 4;

    for (let y = spacing / 2; y < config.height; y += spacing) {
      for (let x = spacing / 2; x < config.width; x += spacing) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private drawGrid(config: TextureConfig): void {
    this.drawSolid(config);

    const lineColor = this.adjustBrightness(config.baseColor, -0.2);
    this.ctx.strokeStyle = `#${lineColor.toString(16).padStart(6, '0')}`;
    this.ctx.lineWidth = 1;

    const spacing = 32;

    for (let x = 0; x <= config.width; x += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, config.height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= config.height; y += spacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(config.width, y);
      this.ctx.stroke();
    }
  }

  private applyNoiseOverlay(noise: NoiseConfig): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const noiseValue = this.perlinNoise(
          x * noise.scale,
          y * noise.scale,
          noise.octaves,
          noise.persistence
        );
        const idx = (y * this.canvas.width + x) * 4;

        // Blend noise with existing color
        const blend = noiseValue * noise.intensity * 0.2;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        if (r !== undefined) imageData.data[idx] = Math.max(0, Math.min(255, r + blend * 255));
        if (g !== undefined) imageData.data[idx + 1] = Math.max(0, Math.min(255, g + blend * 255));
        if (b !== undefined) imageData.data[idx + 2] = Math.max(0, Math.min(255, b + blend * 255));
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Simple Perlin-like noise implementation
   */
  private perlinNoise(x: number, y: number, octaves: number, persistence: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.interpolatedNoise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }

  private interpolatedNoise(x: number, y: number): number {
    const intX = Math.floor(x);
    const fracX = x - intX;
    const intY = Math.floor(y);
    const fracY = y - intY;

    const v1 = this.smoothNoise(intX, intY);
    const v2 = this.smoothNoise(intX + 1, intY);
    const v3 = this.smoothNoise(intX, intY + 1);
    const v4 = this.smoothNoise(intX + 1, intY + 1);

    const i1 = this.cosineInterpolate(v1, v2, fracX);
    const i2 = this.cosineInterpolate(v3, v4, fracX);

    return this.cosineInterpolate(i1, i2, fracY);
  }

  private smoothNoise(x: number, y: number): number {
    const corners = (
      this.noise2D(x - 1, y - 1) + this.noise2D(x + 1, y - 1) +
      this.noise2D(x - 1, y + 1) + this.noise2D(x + 1, y + 1)
    ) / 16;
    const sides = (
      this.noise2D(x - 1, y) + this.noise2D(x + 1, y) +
      this.noise2D(x, y - 1) + this.noise2D(x, y + 1)
    ) / 8;
    const center = this.noise2D(x, y) / 4;
    return corners + sides + center;
  }

  private noise2D(x: number, y: number): number {
    const n = x + y * 57;
    const nn = (n << 13) ^ n;
    return 1.0 - ((nn * (nn * nn * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0;
  }

  private cosineInterpolate(a: number, b: number, x: number): number {
    const ft = x * Math.PI;
    const f = (1 - Math.cos(ft)) * 0.5;
    return a * (1 - f) + b * f;
  }

  private adjustBrightness(color: number, amount: number): number {
    const r = Math.max(0, Math.min(255, ((color >> 16) & 0xff) + amount * 255));
    const g = Math.max(0, Math.min(255, ((color >> 8) & 0xff) + amount * 255));
    const b = Math.max(0, Math.min(255, (color & 0xff) + amount * 255));
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }

  /**
   * Get a cached texture
   */
  getTexture(name: string): THREE.Texture | null {
    return this.textures.get(name) ?? null;
  }

  /**
   * Dispose all textures
   */
  dispose(): void {
    for (const texture of this.textures.values()) {
      texture.dispose();
    }
    this.textures.clear();
  }

  /**
   * Dispose a specific texture
   */
  disposeTexture(name: string): void {
    const texture = this.textures.get(name);
    if (texture) {
      texture.dispose();
      this.textures.delete(name);
    }
  }
}

// Singleton
let globalTextureGenerator: TextureGenerator | null = null;

export function getTextureGenerator(): TextureGenerator {
  if (!globalTextureGenerator) {
    globalTextureGenerator = new TextureGenerator();
  }
  return globalTextureGenerator;
}

export function resetTextureGenerator(): void {
  if (globalTextureGenerator) {
    globalTextureGenerator.dispose();
    globalTextureGenerator = null;
  }
}
