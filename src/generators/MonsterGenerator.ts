/**
 * MonsterGenerator - Procedural monster/horror creature generation
 * Generates eldritch, undead, and fantasy monster types
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

interface MonsterProportions {
  bodySize: number;
  headCount: number;
  headSize: number;
  armCount: number;
  armLength: number;
  legCount: number;
  legLength: number;
  tentacleCount: number;
  tentacleLength: number;
  spikeCount: number;
}

const MONSTER_PRESETS: Record<string, { proportions: Partial<MonsterProportions>; material: { color: number; roughness: number; metalness: number; emissive?: number } }> = {
  slime: {
    proportions: {
      bodySize: 0.5,
      headCount: 0,
      armCount: 0,
      legCount: 0,
      tentacleCount: 0,
    },
    material: { color: 0x00ff00, roughness: 0.2, metalness: 0.3 },
  },
  skeleton: {
    proportions: {
      bodySize: 0.3,
      headCount: 1,
      headSize: 0.15,
      armCount: 2,
      armLength: 0.5,
      legCount: 2,
      legLength: 0.6,
    },
    material: { color: 0xf5f5dc, roughness: 0.9, metalness: 0.0 },
  },
  demon: {
    proportions: {
      bodySize: 0.6,
      headCount: 1,
      headSize: 0.2,
      armCount: 2,
      armLength: 0.7,
      legCount: 2,
      legLength: 0.5,
      spikeCount: 8,
    },
    material: { color: 0x8b0000, roughness: 0.6, metalness: 0.1, emissive: 0x330000 },
  },
  eldritch: {
    proportions: {
      bodySize: 0.8,
      headCount: 3,
      headSize: 0.15,
      armCount: 0,
      tentacleCount: 8,
      tentacleLength: 1.2,
    },
    material: { color: 0x2f1f4f, roughness: 0.5, metalness: 0.2, emissive: 0x100030 },
  },
  golem: {
    proportions: {
      bodySize: 0.8,
      headCount: 1,
      headSize: 0.2,
      armCount: 2,
      armLength: 0.8,
      legCount: 2,
      legLength: 0.5,
    },
    material: { color: 0x696969, roughness: 0.95, metalness: 0.0 },
  },
  ghost: {
    proportions: {
      bodySize: 0.4,
      headCount: 1,
      headSize: 0.2,
      armCount: 2,
      armLength: 0.5,
      legCount: 0,
      tentacleCount: 3,
      tentacleLength: 0.8,
    },
    material: { color: 0xadd8e6, roughness: 0.1, metalness: 0.0 },
  },
};

const DEFAULT_PROPORTIONS: MonsterProportions = {
  bodySize: 0.5,
  headCount: 1,
  headSize: 0.15,
  armCount: 2,
  armLength: 0.5,
  legCount: 2,
  legLength: 0.5,
  tentacleCount: 0,
  tentacleLength: 0,
  spikeCount: 0,
};

export class MonsterGenerator extends BasePlugin implements GeneratorPlugin {
  readonly id = 'monster-generator';
  readonly name = 'Monster Generator';
  readonly version = '1.0.0';
  readonly type = 'generator' as const;

  private monsterCount = 0;

  async generate(params: GenerationParams): Promise<Character> {
    this.assertReady();

    const presetKey = params.style || 'demon';
    const preset = MONSTER_PRESETS[presetKey] ?? MONSTER_PRESETS['demon'];
    if (!preset) {
      throw new Error(`Monster preset not found: ${presetKey}`);
    }

    const proportions: MonsterProportions = {
      ...DEFAULT_PROPORTIONS,
      ...preset.proportions,
    };

    const scale = params.options.detailLevel >= 0.5 ? 1.8 : 1.4;

    const material = new THREE.MeshStandardMaterial({
      color: preset.material.color,
      roughness: preset.material.roughness,
      metalness: preset.material.metalness,
      emissive: preset.material.emissive ?? 0x000000,
      transparent: presetKey === 'ghost' || presetKey === 'slime',
      opacity: presetKey === 'ghost' ? 0.6 : presetKey === 'slime' ? 0.8 : 1.0,
    });

    const monsterRoot = this.buildMonster(proportions, scale, material, presetKey);
    monsterRoot.name = `monster-${++this.monsterCount}`;

    const metadata = this.calculateMetadata(monsterRoot);

    const character: Character = {
      id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: monsterRoot.name,
      type: 'monster',
      model: monsterRoot,
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

  private buildMonster(
    props: MonsterProportions,
    scale: number,
    material: THREE.Material,
    style: string
  ): THREE.Group {
    const root = new THREE.Group();

    // Special case for slime
    if (style === 'slime') {
      return this.buildSlime(props, scale, material);
    }

    const baseY = props.legCount > 0 ? props.legLength * scale : 0;

    // Body
    const bodyGeom = style === 'ghost'
      ? new THREE.ConeGeometry(props.bodySize * scale * 0.5, props.bodySize * scale * 1.5, 8)
      : new THREE.SphereGeometry(props.bodySize * scale * 0.5, 12, 10);
    const body = new THREE.Mesh(bodyGeom, material);
    body.position.y = baseY + props.bodySize * scale * 0.5;
    if (style === 'ghost') {
      body.position.y += props.bodySize * scale * 0.3;
    }
    body.name = 'body';
    root.add(body);

    // Heads
    for (let i = 0; i < props.headCount; i++) {
      const headGeom = new THREE.SphereGeometry(props.headSize * scale, 10, 8);
      const head = new THREE.Mesh(headGeom, material);

      const angle = (i / Math.max(props.headCount, 1)) * Math.PI - Math.PI / 2;
      const xOffset = props.headCount > 1 ? Math.sin(angle) * props.bodySize * scale * 0.3 : 0;

      head.position.set(
        xOffset,
        baseY + props.bodySize * scale + props.headSize * scale * 0.5,
        0
      );
      head.name = `head_${i}`;
      root.add(head);

      // Add horns for demon
      if (style === 'demon') {
        this.addHorns(root, head.position, props.headSize * scale, material);
      }

      // Add eyes
      this.addEyes(root, head.position, props.headSize * scale, style);
    }

    // Arms
    for (let i = 0; i < props.armCount; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const armGeom = new THREE.CapsuleGeometry(
        props.bodySize * scale * 0.08,
        props.armLength * scale,
        4,
        8
      );
      const arm = new THREE.Mesh(armGeom, material);
      arm.position.set(
        side * (props.bodySize * scale * 0.5 + props.bodySize * scale * 0.1),
        baseY + props.bodySize * scale * 0.6,
        0
      );
      arm.rotation.z = side * Math.PI / 6;
      arm.name = `arm_${i}`;
      root.add(arm);
    }

    // Legs
    for (let i = 0; i < props.legCount; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const offset = Math.floor(i / 2) * props.bodySize * scale * 0.3;
      const legGeom = new THREE.CapsuleGeometry(
        props.bodySize * scale * 0.1,
        props.legLength * scale,
        4,
        8
      );
      const leg = new THREE.Mesh(legGeom, material);
      leg.position.set(
        side * props.bodySize * scale * 0.25,
        props.legLength * scale * 0.5,
        offset
      );
      leg.name = `leg_${i}`;
      root.add(leg);
    }

    // Tentacles
    for (let i = 0; i < props.tentacleCount; i++) {
      this.addTentacle(
        root,
        props.tentacleLength * scale,
        i,
        props.tentacleCount,
        baseY + props.bodySize * scale * 0.2,
        material,
        style === 'ghost'
      );
    }

    // Spikes
    if (props.spikeCount > 0) {
      this.addSpikes(root, props.bodySize * scale, props.spikeCount, baseY, material);
    }

    return root;
  }

  private buildSlime(props: MonsterProportions, scale: number, material: THREE.Material): THREE.Group {
    const root = new THREE.Group();

    // Main blob
    const blobGeom = new THREE.SphereGeometry(props.bodySize * scale * 0.5, 16, 12);
    const blob = new THREE.Mesh(blobGeom, material);
    blob.scale.set(1, 0.6, 1);
    blob.position.y = props.bodySize * scale * 0.3;
    blob.name = 'body';
    root.add(blob);

    // Add small bubbles
    for (let i = 0; i < 5; i++) {
      const bubbleSize = Math.random() * 0.1 + 0.05;
      const bubbleGeom = new THREE.SphereGeometry(bubbleSize * scale, 8, 6);
      const bubble = new THREE.Mesh(bubbleGeom, material);
      const angle = (i / 5) * Math.PI * 2;
      bubble.position.set(
        Math.cos(angle) * props.bodySize * scale * 0.3,
        props.bodySize * scale * 0.2 + Math.random() * 0.1,
        Math.sin(angle) * props.bodySize * scale * 0.3
      );
      bubble.name = `bubble_${i}`;
      root.add(bubble);
    }

    // Eyes (floating in slime)
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

    for (let i = 0; i < 2; i++) {
      const eyeGeom = new THREE.SphereGeometry(0.05 * scale, 8, 6);
      const eye = new THREE.Mesh(eyeGeom, eyeMat);
      eye.position.set((i === 0 ? -1 : 1) * 0.1 * scale, props.bodySize * scale * 0.4, 0.15 * scale);
      eye.name = `eye_${i}`;
      root.add(eye);

      const pupilGeom = new THREE.SphereGeometry(0.02 * scale, 6, 4);
      const pupil = new THREE.Mesh(pupilGeom, pupilMat);
      pupil.position.copy(eye.position);
      pupil.position.z += 0.03 * scale;
      pupil.name = `pupil_${i}`;
      root.add(pupil);
    }

    return root;
  }

  private addHorns(
    root: THREE.Group,
    headPos: THREE.Vector3,
    headSize: number,
    material: THREE.Material
  ): void {
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? 1 : -1;
      const hornGeom = new THREE.ConeGeometry(headSize * 0.15, headSize * 0.8, 6);
      const horn = new THREE.Mesh(hornGeom, material);
      horn.position.set(
        headPos.x + side * headSize * 0.4,
        headPos.y + headSize * 0.5,
        headPos.z
      );
      horn.rotation.z = -side * Math.PI / 6;
      horn.name = `horn_${i}`;
      root.add(horn);
    }
  }

  private addEyes(
    root: THREE.Group,
    headPos: THREE.Vector3,
    headSize: number,
    style: string
  ): void {
    const eyeColor = style === 'demon' ? 0xff0000 : style === 'eldritch' ? 0x00ff00 : 0xffffff;
    const eyeMat = new THREE.MeshStandardMaterial({
      color: eyeColor,
      emissive: style === 'demon' || style === 'eldritch' ? eyeColor : 0x000000,
      emissiveIntensity: 0.5,
    });

    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? 1 : -1;
      const eyeGeom = new THREE.SphereGeometry(headSize * 0.15, 8, 6);
      const eye = new THREE.Mesh(eyeGeom, eyeMat);
      eye.position.set(
        headPos.x + side * headSize * 0.3,
        headPos.y + headSize * 0.1,
        headPos.z + headSize * 0.7
      );
      eye.name = `eye_${i}`;
      root.add(eye);
    }
  }

  private addTentacle(
    root: THREE.Group,
    length: number,
    index: number,
    total: number,
    baseY: number,
    material: THREE.Material,
    isGhost: boolean
  ): void {
    const angle = (index / total) * Math.PI * 2;
    const segments = 8;
    const segmentLength = length / segments;

    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const radius = 0.05 * (1 - t * 0.7);
      const segGeom = new THREE.SphereGeometry(radius, 6, 4);
      const seg = new THREE.Mesh(segGeom, material);

      const curl = isGhost ? 0 : Math.sin(t * Math.PI) * 0.3;
      seg.position.set(
        Math.cos(angle) * (0.2 + t * 0.5) + curl * Math.cos(angle + t),
        baseY - i * segmentLength * (isGhost ? 1 : 0.3),
        Math.sin(angle) * (0.2 + t * 0.5) + curl * Math.sin(angle + t)
      );
      seg.name = `tentacle_${index}_seg_${i}`;
      root.add(seg);
    }
  }

  private addSpikes(
    root: THREE.Group,
    bodySize: number,
    count: number,
    baseY: number,
    material: THREE.Material
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spikeGeom = new THREE.ConeGeometry(0.03, 0.15, 4);
      const spike = new THREE.Mesh(spikeGeom, material);

      spike.position.set(
        Math.cos(angle) * bodySize * 0.45,
        baseY + bodySize * 0.5 + (Math.random() - 0.5) * bodySize * 0.5,
        Math.sin(angle) * bodySize * 0.45
      );
      spike.lookAt(
        spike.position.x * 2,
        spike.position.y,
        spike.position.z * 2
      );
      spike.rotateX(Math.PI / 2);
      spike.name = `spike_${i}`;
      root.add(spike);
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
          if (position) vertices += position.count;
          const index = geometry.getIndex();
          if (index) faces += index.count / 3;
          else if (position) faces += position.count / 3;
        }
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => materials.add(m));
        } else {
          materials.add(child.material);
        }
      }
    });

    return { vertices, faces: Math.floor(faces), bones: 0, materials: materials.size };
  }

  getSupportedTypes(): CharacterType[] {
    return ['monster'];
  }

  getAvailableStyles(): string[] {
    return Object.keys(MONSTER_PRESETS);
  }
}
