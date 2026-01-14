# Three.js Character Generator

A TypeScript library for procedurally generating 3D characters with Three.js. Supports humanoids, creatures, monsters, and mechanical units with full export capabilities.

## Features

- **4 Character Types**: Humanoids, Creatures, Monsters, Mechanical units
- **25+ Material Presets**: PBR materials for skin, metal, fabric, organic, stone, energy
- **Procedural Textures**: Generate checker, stripe, gradient, noise patterns
- **Skeletal Rigging**: Humanoid and quadruped skeletons with proper bone hierarchies
- **7 Animation Presets**: Idle, walk, run, jump, attack, hit, death
- **Multiple Export Formats**: glTF/GLB, OBJ, Blender-optimized
- **Preset System**: Save and load character configurations

## Installation

```bash
npm install
```

## Usage

### Quick Start

```typescript
import * as THREE from 'three';
import { HumanoidGenerator } from './generators/HumanoidGenerator';
import { GLTFExporterPlugin } from './exporters/GLTFExporter';

// Initialize generator
const generator = new HumanoidGenerator();
await generator.init();

// Generate a character
const character = await generator.generate({
  type: 'humanoid',
  style: 'stylized',
  options: {
    detailLevel: 0.8,
    includeAnimations: true
  }
});

// Export to glTF
const exporter = new GLTFExporterPlugin();
await exporter.init();
await exporter.export(character, { format: 'glb', binary: true });
```

### Character Types

#### Humanoid
```typescript
import { HumanoidGenerator } from './generators/HumanoidGenerator';

const generator = new HumanoidGenerator();
await generator.init();

const character = await generator.generate({
  type: 'humanoid',
  style: 'realistic' // or 'stylized', 'chibi', 'robot'
});
```

#### Creature
```typescript
import { CreatureGenerator } from './generators/CreatureGenerator';

const generator = new CreatureGenerator();
await generator.init();

const character = await generator.generate({
  type: 'creature',
  style: 'dragon' // or 'wolf', 'snake', 'bird', 'fish'
});
```

#### Monster
```typescript
import { MonsterGenerator } from './generators/MonsterGenerator';

const generator = new MonsterGenerator();
await generator.init();

const character = await generator.generate({
  type: 'monster',
  style: 'demon' // or 'slime', 'skeleton', 'eldritch', 'golem', 'ghost'
});
```

#### Mechanical
```typescript
import { MechanicalGenerator } from './generators/MechanicalGenerator';

const generator = new MechanicalGenerator();
await generator.init();

const character = await generator.generate({
  type: 'mechanical',
  style: 'battle_mech' // or 'humanoid_robot', 'spider_bot', 'drone', 'tank_bot', 'wheeled_bot'
});
```

### Materials

```typescript
import { MaterialLibrary, getMaterialLibrary } from './materials/MaterialLibrary';

const library = getMaterialLibrary();

// Get a preset material
const skin = library.getMaterial('human_skin');
const metal = library.getMaterial('brushed_metal');

// Get all materials in a category
const metallicMaterials = library.getMaterialsByCategory('metal');
```

Available categories: `skin`, `metal`, `fabric`, `organic`, `stone`, `energy`

### Procedural Textures

```typescript
import { TextureGenerator, getTextureGenerator } from './materials/TextureGenerator';

const texGen = getTextureGenerator();

// Generate a checker texture
const checker = texGen.generate({
  width: 512,
  height: 512,
  pattern: 'checker',
  primaryColor: 0xff0000,
  secondaryColor: 0x0000ff
});
```

Pattern types: `solid`, `checker`, `stripes`, `gradient`, `noise`, `dots`, `grid`

### Rigging

```typescript
import { SkeletonBuilder, getSkeletonBuilder } from './rigging/SkeletonBuilder';

const builder = getSkeletonBuilder();

// Build humanoid skeleton
const { skeleton, bones } = builder.buildHumanoid();

// Build quadruped skeleton
const { skeleton: quadSkeleton } = builder.buildQuadruped();
```

### Animations

```typescript
import { AnimationBuilder, getAnimationBuilder } from './rigging/AnimationBuilder';

const animBuilder = getAnimationBuilder();

// Create idle animation
const idle = animBuilder.createAnimation('idle', skeleton);

// Create walk animation
const walk = animBuilder.createAnimation('walk', skeleton);

// Available: 'idle', 'walk', 'run', 'jump', 'attack', 'hit', 'death'
```

### Export

#### glTF/GLB Export
```typescript
import { GLTFExporterPlugin } from './exporters/GLTFExporter';

const exporter = new GLTFExporterPlugin();
await exporter.init();

// Export as GLB (binary)
await exporter.export(character, { format: 'glb', binary: true });

// Export as glTF (JSON)
await exporter.export(character, { format: 'gltf', binary: false });
```

#### OBJ Export
```typescript
import { OBJExporterPlugin } from './exporters/OBJExporter';

const exporter = new OBJExporterPlugin();
await exporter.init();

await exporter.export(character, { includeMaterials: true });
```

#### Blender Export
```typescript
import { BlenderIntegrationPlugin } from './integrations/BlenderIntegration';

const blender = new BlenderIntegrationPlugin();
await blender.init();

// Export optimized for Blender
await blender.sync(character);

// Get Python import script
const script = blender.getImportScript('/path/to/file.glb');
```

### Presets

```typescript
import { getPresetManager } from './integrations/PresetManager';

const presets = getPresetManager();

// Save a preset
const preset = presets.createPreset(character, 'My Hero', 'A stylized hero character');

// Load a preset
const loaded = presets.getPreset(preset.id);

// Get starter presets
const starters = presets.getStarterPresets();

// Export/Import presets
const json = presets.exportToJSON();
presets.importFromJSON(json);
```

## Architecture

```
src/
├── core/           # Base scene management
├── types/          # TypeScript type definitions
├── plugins/        # Plugin system base classes
├── generators/     # Character generators
│   ├── HumanoidGenerator.ts
│   ├── CreatureGenerator.ts
│   ├── MonsterGenerator.ts
│   └── MechanicalGenerator.ts
├── materials/      # Material system
│   ├── MaterialLibrary.ts
│   └── TextureGenerator.ts
├── rigging/        # Skeleton and animation
│   ├── SkeletonBuilder.ts
│   └── AnimationBuilder.ts
├── exporters/      # Export plugins
│   ├── GLTFExporter.ts
│   └── OBJExporter.ts
├── integrations/   # External tool integration
│   ├── BlenderIntegration.ts
│   └── PresetManager.ts
└── ui/             # Preview viewport
```

## Plugin System

All generators, exporters, and integrations use a plugin architecture:

```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  type: 'generator' | 'processor' | 'exporter' | 'integration';

  init(): Promise<void>;
  destroy(): Promise<void>;
}
```

## Development

```bash
# Start dev server
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build
```

## Browser Support

- Modern browsers with WebGL 2 support
- Chrome 90+, Firefox 88+, Safari 15+, Edge 90+

## License

MIT
