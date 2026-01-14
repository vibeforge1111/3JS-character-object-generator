/**
 * CreatureGenerator - Procedural creature/animal generation
 * Generates quadrupeds, serpentine, and other creature body types
 */

import * as THREE from 'three';
import { BasePlugin } from '../plugins/BasePlugin.js';
import type {
  GeneratorPlugin,
  Character,
  CharacterType,
  GenerationParams,
  CharacterMetadata,
} from '../plugins/types.js';

/**
 * Creature body configurations
 */
type CreatureBodyType = 'quadruped' | 'serpentine' | 'avian' | 'aquatic';

interface CreatureProportions {
  bodyLength: number;
  bodyWidth: number;
  bodyHeight: number;
  headSize: number;
  neckLength: number;
  tailLength: number;
  tailSegments: number;
  legLength: number;
  legCount: number;
  wingSpan: number;
}

const CREATURE_PRESETS: Record<string, { bodyType: CreatureBodyType; proportions: Partial<CreatureProportions>; material: { color: number; roughness: number; metalness: number } }> = {
  wolf: {
    bodyType: 'quadruped',
    proportions: {
      bodyLength: 0.8,
      bodyWidth: 0.25,
      bodyHeight: 0.3,
      headSize: 0.15,
      neckLength: 0.15,
      tailLength: 0.4,
      tailSegments: 5,
      legLength: 0.4,
      legCount: 4,
    },
    material: { color: 0x4a4a4a, roughness: 0.8, metalness: 0.0 },
  },
  dragon: {
    bodyType: 'quadruped',
    proportions: {
      bodyLength: 1.2,
      bodyWidth: 0.4,
      bodyHeight: 0.5,
      headSize: 0.25,
      neckLength: 0.4,
      tailLength: 1.0,
      tailSegments: 8,
      legLength: 0.5,
      legCount: 4,
      wingSpan: 2.0,
    },
    material: { color: 0x8b0000, roughness: 0.6, metalness: 0.2 },
  },
  snake: {
    bodyType: 'serpentine',
    proportions: {
      bodyLength: 2.0,
      bodyWidth: 0.1,
      bodyHeight: 0.1,
      headSize: 0.12,
      neckLength: 0,
      tailLength: 0,
      tailSegments: 20,
      legCount: 0,
    },
    material: { color: 0x228b22, roughness: 0.5, metalness: 0.1 },
  },
  bird: {
    bodyType: 'avian',
    proportions: {
      bodyLength: 0.3,
      bodyWidth: 0.15,
      bodyHeight: 0.2,
      headSize: 0.08,
      neckLength: 0.1,
      tailLength: 0.2,
      tailSegments: 3,
      legLength: 0.15,
      legCount: 2,
      wingSpan: 0.8,
    },
    material: { color: 0x1e90ff, roughness: 0.7, metalness: 0.0 },
  },
  fish: {
    bodyType: 'aquatic',
    proportions: {
      bodyLength: 0.5,
      bodyWidth: 0.15,
      bodyHeight: 0.2,
      headSize: 0.1,
      neckLength: 0,
      tailLength: 0.15,
      tailSegments: 1,
      legCount: 0,
    },
    material: { color: 0xffa500, roughness: 0.3, metalness: 0.4 },
  },
};

const DEFAULT_PROPORTIONS: CreatureProportions = {
  bodyLength: 0.6,
  bodyWidth: 0.2,
  bodyHeight: 0.25,
  headSize: 0.12,
  neckLength: 0.1,
  tailLength: 0.3,
  tailSegments: 4,
  legLength: 0.3,
  legCount: 4,
  wingSpan: 0,
};

/**
 * CreatureGenerator Plugin
 */
export class CreatureGenerator extends BasePlugin implements GeneratorPlugin {
  readonly id = 'creature-generator';
  readonly name = 'Creature Generator';
  readonly version = '1.0.0';
  readonly type = 'generator' as const;

  private creatureCount = 0;

  async generate(params: GenerationParams): Promise<Character> {
    this.assertReady();

    const presetKey = params.style || 'wolf';
    const preset = CREATURE_PRESETS[presetKey] ?? CREATURE_PRESETS['wolf'];
    if (!preset) {
      throw new Error(`Creature preset not found: ${presetKey}`);
    }

    const proportions: CreatureProportions = {
      ...DEFAULT_PROPORTIONS,
      ...preset.proportions,
    };

    const scale = params.options.detailLevel >= 0.5 ? 1.5 : 1.0;

    const material = new THREE.MeshStandardMaterial({
      color: preset.material.color,
      roughness: preset.material.roughness,
      metalness: preset.material.metalness,
    });

    let creatureRoot: THREE.Group;

    switch (preset.bodyType) {
      case 'serpentine':
        creatureRoot = this.buildSerpentine(proportions, scale, material);
        break;
      case 'avian':
        creatureRoot = this.buildAvian(proportions, scale, material);
        break;
      case 'aquatic':
        creatureRoot = this.buildAquatic(proportions, scale, material);
        break;
      case 'quadruped':
      default:
        creatureRoot = this.buildQuadruped(proportions, scale, material);
        break;
    }

    creatureRoot.name = `creature-${++this.creatureCount}`;

    const metadata = this.calculateMetadata(creatureRoot);

    const character: Character = {
      id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: creatureRoot.name,
      type: 'creature',
      model: creatureRoot,
      metadata: {
        ...metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        plugins_used: [this.id],
      },
      generationParams: params,
    };

    return character;
  }

  private buildQuadruped(props: CreatureProportions, scale: number, material: THREE.Material): THREE.Group {
    const root = new THREE.Group();

    // Body
    const bodyGeom = new THREE.CapsuleGeometry(
      props.bodyHeight * scale * 0.5,
      props.bodyLength * scale,
      8,
      16
    );
    const body = new THREE.Mesh(bodyGeom, material);
    body.rotation.z = Math.PI / 2;
    body.position.y = props.legLength * scale + props.bodyHeight * scale * 0.5;
    body.name = 'body';
    root.add(body);

    // Head
    const headGeom = new THREE.SphereGeometry(props.headSize * scale, 12, 8);
    const head = new THREE.Mesh(headGeom, material);
    head.position.set(
      props.bodyLength * scale * 0.5 + props.neckLength * scale + props.headSize * scale * 0.5,
      props.legLength * scale + props.bodyHeight * scale * 0.7,
      0
    );
    head.name = 'head';
    root.add(head);

    // Neck
    if (props.neckLength > 0) {
      const neckGeom = new THREE.CylinderGeometry(
        props.headSize * scale * 0.4,
        props.bodyHeight * scale * 0.3,
        props.neckLength * scale,
        8
      );
      const neck = new THREE.Mesh(neckGeom, material);
      neck.rotation.z = -Math.PI / 4;
      neck.position.set(
        props.bodyLength * scale * 0.5 + props.neckLength * scale * 0.3,
        props.legLength * scale + props.bodyHeight * scale * 0.6,
        0
      );
      neck.name = 'neck';
      root.add(neck);
    }

    // Legs
    const legPositions = [
      { x: props.bodyLength * scale * 0.35, z: props.bodyWidth * scale * 0.5 },
      { x: props.bodyLength * scale * 0.35, z: -props.bodyWidth * scale * 0.5 },
      { x: -props.bodyLength * scale * 0.35, z: props.bodyWidth * scale * 0.5 },
      { x: -props.bodyLength * scale * 0.35, z: -props.bodyWidth * scale * 0.5 },
    ];

    for (let i = 0; i < Math.min(props.legCount, 4); i++) {
      const pos = legPositions[i];
      if (pos) {
        const legGeom = new THREE.CylinderGeometry(
          props.bodyWidth * scale * 0.15,
          props.bodyWidth * scale * 0.1,
          props.legLength * scale,
          8
        );
        const leg = new THREE.Mesh(legGeom, material);
        leg.position.set(pos.x, props.legLength * scale * 0.5, pos.z);
        leg.name = `leg_${i}`;
        root.add(leg);
      }
    }

    // Tail
    this.addTail(root, props, scale, material, -props.bodyLength * scale * 0.5, props.legLength * scale + props.bodyHeight * scale * 0.3);

    // Wings (if dragon-like)
    if (props.wingSpan > 0) {
      this.addWings(root, props, scale, material);
    }

    return root;
  }

  private buildSerpentine(props: CreatureProportions, scale: number, material: THREE.Material): THREE.Group {
    const root = new THREE.Group();
    const segmentCount = props.tailSegments;
    const segmentLength = (props.bodyLength * scale) / segmentCount;
    const baseRadius = props.bodyWidth * scale * 0.5;

    for (let i = 0; i < segmentCount; i++) {
      const t = i / segmentCount;
      const radius = baseRadius * (1 - t * 0.5); // Taper toward tail
      const segGeom = new THREE.SphereGeometry(radius, 8, 6);
      const segment = new THREE.Mesh(segGeom, material);

      // Create S-curve
      const angle = t * Math.PI * 2;
      segment.position.set(
        i * segmentLength - props.bodyLength * scale * 0.5,
        radius + Math.sin(angle) * 0.1 * scale,
        Math.sin(angle * 0.5) * 0.2 * scale
      );
      segment.name = `segment_${i}`;
      root.add(segment);
    }

    // Head
    const headGeom = new THREE.SphereGeometry(props.headSize * scale, 12, 8);
    const head = new THREE.Mesh(headGeom, material);
    head.position.set(-props.bodyLength * scale * 0.5 - props.headSize * scale, baseRadius, 0);
    head.scale.set(1.3, 1, 0.8);
    head.name = 'head';
    root.add(head);

    return root;
  }

  private buildAvian(props: CreatureProportions, scale: number, material: THREE.Material): THREE.Group {
    const root = new THREE.Group();

    // Body (egg-shaped)
    const bodyGeom = new THREE.SphereGeometry(props.bodyHeight * scale * 0.5, 12, 8);
    const body = new THREE.Mesh(bodyGeom, material);
    body.scale.set(1.5, 1, 0.8);
    body.position.y = props.legLength * scale + props.bodyHeight * scale * 0.5;
    body.name = 'body';
    root.add(body);

    // Head
    const headGeom = new THREE.SphereGeometry(props.headSize * scale, 10, 8);
    const head = new THREE.Mesh(headGeom, material);
    head.position.set(
      props.bodyLength * scale * 0.3,
      props.legLength * scale + props.bodyHeight * scale * 0.8,
      0
    );
    head.name = 'head';
    root.add(head);

    // Beak
    const beakGeom = new THREE.ConeGeometry(props.headSize * scale * 0.3, props.headSize * scale * 0.5, 4);
    const beak = new THREE.Mesh(beakGeom, material);
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(
      props.bodyLength * scale * 0.3 + props.headSize * scale,
      props.legLength * scale + props.bodyHeight * scale * 0.75,
      0
    );
    beak.name = 'beak';
    root.add(beak);

    // Legs (bird legs are thin)
    for (let i = 0; i < 2; i++) {
      const legGeom = new THREE.CylinderGeometry(0.01 * scale, 0.015 * scale, props.legLength * scale, 6);
      const leg = new THREE.Mesh(legGeom, material);
      leg.position.set(0, props.legLength * scale * 0.5, (i === 0 ? 1 : -1) * props.bodyWidth * scale * 0.3);
      leg.name = `leg_${i}`;
      root.add(leg);
    }

    // Wings
    this.addWings(root, props, scale, material);

    // Tail feathers
    const tailGeom = new THREE.ConeGeometry(props.tailLength * scale * 0.3, props.tailLength * scale, 4);
    const tail = new THREE.Mesh(tailGeom, material);
    tail.rotation.z = Math.PI / 2 + 0.3;
    tail.position.set(-props.bodyLength * scale * 0.4, props.legLength * scale + props.bodyHeight * scale * 0.3, 0);
    tail.name = 'tail';
    root.add(tail);

    return root;
  }

  private buildAquatic(props: CreatureProportions, scale: number, material: THREE.Material): THREE.Group {
    const root = new THREE.Group();

    // Body (fish-shaped)
    const bodyGeom = new THREE.SphereGeometry(props.bodyHeight * scale * 0.5, 12, 8);
    const body = new THREE.Mesh(bodyGeom, material);
    body.scale.set(2, 1, 0.6);
    body.position.y = props.bodyHeight * scale * 0.5;
    body.name = 'body';
    root.add(body);

    // Head (integrated with body, just add eyes placeholder)
    const eyeGeom = new THREE.SphereGeometry(0.02 * scale, 6, 6);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    for (let i = 0; i < 2; i++) {
      const eye = new THREE.Mesh(eyeGeom, eyeMat);
      eye.position.set(
        props.bodyLength * scale * 0.3,
        props.bodyHeight * scale * 0.6,
        (i === 0 ? 1 : -1) * props.bodyWidth * scale * 0.25
      );
      eye.name = `eye_${i}`;
      root.add(eye);
    }

    // Dorsal fin
    const dorsalGeom = new THREE.ConeGeometry(0.05 * scale, 0.15 * scale, 4);
    const dorsal = new THREE.Mesh(dorsalGeom, material);
    dorsal.position.set(0, props.bodyHeight * scale * 0.9, 0);
    dorsal.name = 'dorsal_fin';
    root.add(dorsal);

    // Tail fin
    const tailGeom = new THREE.ConeGeometry(props.tailLength * scale * 0.5, props.tailLength * scale, 4);
    const tail = new THREE.Mesh(tailGeom, material);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-props.bodyLength * scale * 0.5, props.bodyHeight * scale * 0.5, 0);
    tail.name = 'tail_fin';
    root.add(tail);

    // Pectoral fins
    for (let i = 0; i < 2; i++) {
      const finGeom = new THREE.ConeGeometry(0.03 * scale, 0.1 * scale, 4);
      const fin = new THREE.Mesh(finGeom, material);
      fin.rotation.x = (i === 0 ? 1 : -1) * Math.PI / 4;
      fin.rotation.z = Math.PI / 2;
      fin.position.set(
        props.bodyLength * scale * 0.1,
        props.bodyHeight * scale * 0.3,
        (i === 0 ? 1 : -1) * props.bodyWidth * scale * 0.3
      );
      fin.name = `pectoral_fin_${i}`;
      root.add(fin);
    }

    return root;
  }

  private addTail(
    root: THREE.Group,
    props: CreatureProportions,
    scale: number,
    material: THREE.Material,
    startX: number,
    startY: number
  ): void {
    const segmentCount = props.tailSegments;
    const segmentLength = (props.tailLength * scale) / segmentCount;

    for (let i = 0; i < segmentCount; i++) {
      const t = i / segmentCount;
      const radius = props.bodyWidth * scale * 0.2 * (1 - t * 0.7);
      const segGeom = new THREE.SphereGeometry(radius, 6, 4);
      const segment = new THREE.Mesh(segGeom, material);

      segment.position.set(
        startX - i * segmentLength,
        startY - i * segmentLength * 0.3,
        0
      );
      segment.name = `tail_${i}`;
      root.add(segment);
    }
  }

  private addWings(
    root: THREE.Group,
    props: CreatureProportions,
    scale: number,
    material: THREE.Material
  ): void {
    const wingLength = props.wingSpan * scale * 0.5;

    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? 1 : -1;
      const wingGroup = new THREE.Group();
      wingGroup.name = i === 0 ? 'wing_left' : 'wing_right';

      // Wing membrane (simplified as flat plane)
      const wingGeom = new THREE.PlaneGeometry(wingLength, wingLength * 0.4);
      const wing = new THREE.Mesh(wingGeom, material);
      wing.rotation.y = side * Math.PI / 6;
      wing.position.set(0, 0, side * wingLength * 0.5);

      wingGroup.add(wing);
      wingGroup.position.set(0, props.legLength * scale + props.bodyHeight * scale * 0.8, 0);
      wingGroup.rotation.x = side * 0.2;

      root.add(wingGroup);
    }
  }

  private calculateMetadata(model: THREE.Group): Omit<CharacterMetadata, 'createdAt' | 'updatedAt' | 'plugins_used'> {
    let vertices = 0;
    let faces = 0;
    const materials = new Set<THREE.Material>();

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry;
        if (geometry instanceof THREE.BufferGeometry) {
          const position = geometry.getAttribute('position');
          if (position) {
            vertices += position.count;
          }
          const index = geometry.getIndex();
          if (index) {
            faces += index.count / 3;
          } else if (position) {
            faces += position.count / 3;
          }
        }
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => materials.add(m));
        } else {
          materials.add(child.material);
        }
      }
    });

    return {
      vertices,
      faces: Math.floor(faces),
      bones: 0,
      materials: materials.size,
    };
  }

  getSupportedTypes(): CharacterType[] {
    return ['creature'];
  }

  getAvailableStyles(): string[] {
    return Object.keys(CREATURE_PRESETS);
  }
}
