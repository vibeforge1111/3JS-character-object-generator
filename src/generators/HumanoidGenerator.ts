/**
 * HumanoidGenerator - Procedural humanoid character generation
 * Following H70 threejs-3d-graphics patterns:
 * - Proper geometry disposal
 * - Memory-safe material management
 * - Hierarchical object structure
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
 * Humanoid body proportions (normalized to unit height)
 */
interface HumanoidProportions {
  headHeight: number;
  headWidth: number;
  neckHeight: number;
  torsoHeight: number;
  torsoWidth: number;
  torsoDepth: number;
  armLength: number;
  armWidth: number;
  legLength: number;
  legWidth: number;
  footLength: number;
  footHeight: number;
}

/**
 * Default proportions for humanoid characters
 */
const DEFAULT_PROPORTIONS: HumanoidProportions = {
  headHeight: 0.12,
  headWidth: 0.08,
  neckHeight: 0.03,
  torsoHeight: 0.25,
  torsoWidth: 0.18,
  torsoDepth: 0.10,
  armLength: 0.30,
  armWidth: 0.04,
  legLength: 0.45,
  legWidth: 0.06,
  footLength: 0.10,
  footHeight: 0.03,
};

/**
 * Style presets for different character aesthetics
 */
interface StylePreset {
  proportions: Partial<HumanoidProportions>;
  material: {
    color: number;
    roughness: number;
    metalness: number;
  };
}

const STYLE_PRESETS: Record<string, StylePreset> = {
  realistic: {
    proportions: {},
    material: { color: 0xd4a574, roughness: 0.7, metalness: 0.0 },
  },
  stylized: {
    proportions: {
      headHeight: 0.15,
      headWidth: 0.10,
      torsoHeight: 0.22,
    },
    material: { color: 0xffd4a0, roughness: 0.5, metalness: 0.0 },
  },
  chibi: {
    proportions: {
      headHeight: 0.25,
      headWidth: 0.20,
      torsoHeight: 0.20,
      legLength: 0.30,
    },
    material: { color: 0xffe4c4, roughness: 0.4, metalness: 0.0 },
  },
  robot: {
    proportions: {
      headHeight: 0.10,
      headWidth: 0.10,
      torsoWidth: 0.20,
    },
    material: { color: 0x808080, roughness: 0.3, metalness: 0.8 },
  },
};

/**
 * Creates a capsule-like shape using cylinder with spheres at ends
 */
function createLimb(
  length: number,
  radius: number,
  material: THREE.Material
): THREE.Group {
  const group = new THREE.Group();

  // Cylinder for main body
  const cylinderGeom = new THREE.CylinderGeometry(radius, radius, length - radius * 2, 8);
  const cylinder = new THREE.Mesh(cylinderGeom, material);
  group.add(cylinder);

  // Sphere caps
  const sphereGeom = new THREE.SphereGeometry(radius, 8, 6);

  const topSphere = new THREE.Mesh(sphereGeom, material);
  topSphere.position.y = (length - radius * 2) / 2;
  group.add(topSphere);

  const bottomSphere = new THREE.Mesh(sphereGeom, material);
  bottomSphere.position.y = -(length - radius * 2) / 2;
  group.add(bottomSphere);

  return group;
}

/**
 * HumanoidGenerator Plugin
 * Creates procedural humanoid characters with customizable proportions and styles
 */
export class HumanoidGenerator extends BasePlugin implements GeneratorPlugin {
  readonly id = 'humanoid-generator';
  readonly name = 'Humanoid Generator';
  readonly version = '1.0.0';
  readonly type = 'generator' as const;

  private characterCount = 0;

  /**
   * Generate a humanoid character
   */
  async generate(params: GenerationParams): Promise<Character> {
    this.assertReady();

    // Get style preset or use default
    const styleKey = params.style || 'realistic';
    const stylePreset = STYLE_PRESETS[styleKey] ?? STYLE_PRESETS['realistic'];
    if (!stylePreset) {
      throw new Error(`Style preset not found: ${styleKey}`);
    }

    // Merge proportions with defaults
    const proportions: HumanoidProportions = {
      ...DEFAULT_PROPORTIONS,
      ...stylePreset.proportions,
    };

    // Calculate total height for scaling
    const totalHeight = params.options.detailLevel >= 0.5 ? 1.8 : 1.6; // meters

    // Create materials (shared across body parts for efficiency)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: stylePreset.material.color,
      roughness: stylePreset.material.roughness,
      metalness: stylePreset.material.metalness,
    });

    // Build the character
    const characterRoot = this.buildHumanoid(proportions, totalHeight, bodyMaterial);
    characterRoot.name = `humanoid-${++this.characterCount}`;

    // Calculate metadata
    const metadata = this.calculateMetadata(characterRoot);

    const character: Character = {
      id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: characterRoot.name,
      type: 'humanoid',
      model: characterRoot,
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

  /**
   * Build the humanoid mesh hierarchy
   */
  private buildHumanoid(
    props: HumanoidProportions,
    height: number,
    material: THREE.Material
  ): THREE.Group {
    const root = new THREE.Group();

    // Scale factor to match desired height
    const scale = height;

    // === HEAD ===
    const headGeom = new THREE.SphereGeometry(props.headWidth * scale, 16, 12);
    const head = new THREE.Mesh(headGeom, material);
    head.name = 'head';

    // === NECK ===
    const neckGeom = new THREE.CylinderGeometry(
      props.headWidth * 0.4 * scale,
      props.headWidth * 0.5 * scale,
      props.neckHeight * scale,
      8
    );
    const neck = new THREE.Mesh(neckGeom, material);
    neck.name = 'neck';

    // === TORSO ===
    const torsoGeom = new THREE.BoxGeometry(
      props.torsoWidth * scale,
      props.torsoHeight * scale,
      props.torsoDepth * scale
    );
    const torso = new THREE.Mesh(torsoGeom, material);
    torso.name = 'torso';

    // === ARMS ===
    const armGroup = (isLeft: boolean): THREE.Group => {
      const arm = createLimb(props.armLength * scale, props.armWidth * scale, material);
      arm.name = isLeft ? 'arm_left' : 'arm_right';
      return arm;
    };
    const leftArm = armGroup(true);
    const rightArm = armGroup(false);

    // === LEGS ===
    const legGroup = (isLeft: boolean): THREE.Group => {
      const leg = createLimb(props.legLength * scale, props.legWidth * scale, material);
      leg.name = isLeft ? 'leg_left' : 'leg_right';
      return leg;
    };
    const leftLeg = legGroup(true);
    const rightLeg = legGroup(false);

    // === FEET ===
    const footGeom = new THREE.BoxGeometry(
      props.legWidth * scale,
      props.footHeight * scale,
      props.footLength * scale
    );
    const leftFoot = new THREE.Mesh(footGeom, material);
    leftFoot.name = 'foot_left';
    const rightFoot = new THREE.Mesh(footGeom, material);
    rightFoot.name = 'foot_right';

    // === POSITION BODY PARTS ===
    // Calculate vertical positions from ground up
    const footY = props.footHeight * 0.5 * scale;
    const legY = footY + props.footHeight * 0.5 * scale + props.legLength * 0.5 * scale;
    const torsoY = legY + props.legLength * 0.5 * scale + props.torsoHeight * 0.5 * scale;
    const neckY = torsoY + props.torsoHeight * 0.5 * scale + props.neckHeight * 0.5 * scale;
    const headY = neckY + props.neckHeight * 0.5 * scale + props.headHeight * 0.5 * scale;

    // Position head
    head.position.y = headY;

    // Position neck
    neck.position.y = neckY;

    // Position torso
    torso.position.y = torsoY;

    // Position arms (attached at shoulders)
    const shoulderX = (props.torsoWidth * 0.5 + props.armWidth) * scale;
    const shoulderY = torsoY + props.torsoHeight * 0.3 * scale;
    leftArm.position.set(-shoulderX, shoulderY, 0);
    leftArm.rotation.z = Math.PI * 0.1; // Slight angle outward
    rightArm.position.set(shoulderX, shoulderY, 0);
    rightArm.rotation.z = -Math.PI * 0.1;

    // Position legs
    const hipX = (props.torsoWidth * 0.25) * scale;
    leftLeg.position.set(-hipX, legY, 0);
    rightLeg.position.set(hipX, legY, 0);

    // Position feet
    const footZ = (props.footLength * 0.5 - props.legWidth * 0.5) * scale;
    leftFoot.position.set(-hipX, footY, footZ);
    rightFoot.position.set(hipX, footY, footZ);

    // Add all parts to root
    root.add(head);
    root.add(neck);
    root.add(torso);
    root.add(leftArm);
    root.add(rightArm);
    root.add(leftLeg);
    root.add(rightLeg);
    root.add(leftFoot);
    root.add(rightFoot);

    return root;
  }

  /**
   * Calculate metadata for a character model
   */
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
      bones: 0, // No rigging yet
      materials: materials.size,
    };
  }

  /**
   * Get supported character types
   */
  getSupportedTypes(): CharacterType[] {
    return ['humanoid'];
  }

  /**
   * Get available style presets
   */
  getAvailableStyles(): string[] {
    return Object.keys(STYLE_PRESETS);
  }
}
