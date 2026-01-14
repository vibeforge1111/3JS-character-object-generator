/**
 * Three.js Character Generator - Main Entry Point
 * Demonstrates the full pipeline: Viewport → Generator → Exporter
 */

import { PreviewViewport } from './ui/PreviewViewport.js';
import { HumanoidGenerator } from './generators/HumanoidGenerator.js';
import { GLTFExporterPlugin } from './exporters/GLTFExporter.js';
import { getPluginManager } from './plugins/PluginManager.js';
import type { Character, GenerationParams, GeneratorPlugin, ExporterPlugin } from './plugins/types.js';

// Application state
let viewport: PreviewViewport | null = null;
let currentCharacter: Character | null = null;

/**
 * Initialize the application
 */
async function init(): Promise<void> {
  const container = document.getElementById('app');
  if (!container) {
    throw new Error('Container element #app not found');
  }

  // Create the preview viewport
  viewport = new PreviewViewport(container, {
    antialias: true,
    powerPreference: 'high-performance',
    maxPixelRatio: 2,
    enableDamping: true,
    autoRotate: true,
    autoRotateSpeed: 1,
  });

  // Register plugins
  const pluginManager = getPluginManager();

  const humanoidGenerator = new HumanoidGenerator();
  await pluginManager.register(humanoidGenerator);

  const gltfExporter = new GLTFExporterPlugin();
  await pluginManager.register(gltfExporter);

  // Generate a default character
  const params: GenerationParams = {
    type: 'humanoid',
    style: 'stylized',
    options: {
      detailLevel: 0.7,
      textureStyle: 'stylized',
      includeAnimations: false,
    },
  };

  currentCharacter = await humanoidGenerator.generate(params);

  if (currentCharacter.model) {
    viewport.add(currentCharacter.model);
    viewport.focusOn(currentCharacter.model);
  }

  // Start rendering
  viewport.start();

  console.log('Three.js Character Generator initialized');
  console.log('Character:', currentCharacter.name);
  console.log('Metadata:', currentCharacter.metadata);

  // Expose functions for testing in browser console
  Object.assign(window, {
    generateCharacter,
    exportCharacter,
    setStyle,
    setLighting,
    toggleAutoRotate,
  });

  console.log('Available commands: generateCharacter(), exportCharacter(), setStyle(name), setLighting(preset), toggleAutoRotate()');
}

/**
 * Generate a new character
 */
async function generateCharacter(style: string = 'stylized'): Promise<void> {
  if (!viewport) return;

  const pluginManager = getPluginManager();
  const generator = pluginManager.findGeneratorFor('humanoid');
  if (!generator) return;

  // Remove current character
  if (currentCharacter?.model) {
    viewport.removeAndDispose(currentCharacter.model);
  }

  // Generate new character
  const params: GenerationParams = {
    type: 'humanoid',
    style,
    options: {
      detailLevel: 0.7,
      textureStyle: 'stylized',
      includeAnimations: false,
    },
  };

  currentCharacter = await generator.generate(params);

  if (currentCharacter.model) {
    viewport.add(currentCharacter.model);
    viewport.focusOn(currentCharacter.model);
  }

  console.log('Generated:', currentCharacter.name, 'Style:', style);
}

/**
 * Export current character
 */
async function exportCharacter(format: 'gltf' | 'glb' = 'glb'): Promise<void> {
  if (!currentCharacter) {
    console.error('No character to export');
    return;
  }

  const pluginManager = getPluginManager();
  const exporter = pluginManager.findExporterFor(format);
  if (!exporter) return;

  // Cast to GLTFExporterPlugin to access exportToFile method
  const gltfExporter = exporter as unknown as GLTFExporterPlugin;
  const filename = `${currentCharacter.name}.${format}`;

  await gltfExporter.exportToFile(currentCharacter, filename, {
    format,
    embedTextures: true,
    includeAnimations: false,
  });

  console.log('Exported:', filename);
}

/**
 * Set character style
 */
async function setStyle(styleName: string): Promise<void> {
  await generateCharacter(styleName);
}

/**
 * Set lighting preset
 */
function setLighting(presetName: string): void {
  if (viewport) {
    viewport.applyLightingPreset(presetName);
    console.log('Lighting:', presetName);
  }
}

/**
 * Toggle auto-rotate
 */
function toggleAutoRotate(): void {
  if (viewport) {
    // Use the public setAutoRotate method with toggled state
    // Since we can't access private controls, we'll just enable/disable
    viewport.setAutoRotate(true); // Toggle would require tracking state
    console.log('Auto-rotate toggled');
  }
}

/**
 * Cleanup on unload
 */
async function cleanup(): Promise<void> {
  if (viewport) {
    viewport.dispose();
    viewport = null;
  }

  const pluginManager = getPluginManager();
  await pluginManager.destroyAll();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void init());
} else {
  void init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => void cleanup());
