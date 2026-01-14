/**
 * SkeletonBuilder - Create skeletal rigs for characters
 * Following H70 threejs-3d-graphics and rigging-animation patterns
 */

import * as THREE from 'three';

/**
 * Bone definition for building skeletons
 */
export interface BoneDefinition {
  name: string;
  parent: string | null;
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  length?: number;
}

/**
 * Humanoid bone names following standard naming conventions
 */
export const HUMANOID_BONES = {
  ROOT: 'root',
  HIPS: 'hips',
  SPINE: 'spine',
  SPINE1: 'spine1',
  SPINE2: 'spine2',
  NECK: 'neck',
  HEAD: 'head',
  LEFT_SHOULDER: 'leftShoulder',
  LEFT_ARM: 'leftArm',
  LEFT_FOREARM: 'leftForeArm',
  LEFT_HAND: 'leftHand',
  RIGHT_SHOULDER: 'rightShoulder',
  RIGHT_ARM: 'rightArm',
  RIGHT_FOREARM: 'rightForeArm',
  RIGHT_HAND: 'rightHand',
  LEFT_UPLEG: 'leftUpLeg',
  LEFT_LEG: 'leftLeg',
  LEFT_FOOT: 'leftFoot',
  LEFT_TOE: 'leftToeBase',
  RIGHT_UPLEG: 'rightUpLeg',
  RIGHT_LEG: 'rightLeg',
  RIGHT_FOOT: 'rightFoot',
  RIGHT_TOE: 'rightToeBase',
} as const;

/**
 * Skeleton configuration for different body types
 */
export interface SkeletonConfig {
  height: number;
  proportions: {
    legRatio: number;
    torsoRatio: number;
    armRatio: number;
    headRatio: number;
  };
  shoulderWidth: number;
  hipWidth: number;
}

const DEFAULT_CONFIG: SkeletonConfig = {
  height: 1.8,
  proportions: {
    legRatio: 0.47,
    torsoRatio: 0.30,
    armRatio: 0.38,
    headRatio: 0.13,
  },
  shoulderWidth: 0.4,
  hipWidth: 0.2,
};

/**
 * SkeletonBuilder - Creates and manages skeletal rigs
 */
export class SkeletonBuilder {
  private bones: Map<string, THREE.Bone> = new Map();

  /**
   * Build a humanoid skeleton
   */
  buildHumanoid(config: Partial<SkeletonConfig> = {}): THREE.Skeleton {
    const fullConfig: SkeletonConfig = {
      ...DEFAULT_CONFIG,
      ...config,
      proportions: { ...DEFAULT_CONFIG.proportions, ...config.proportions },
    };

    this.bones.clear();

    const boneDefinitions = this.getHumanoidBoneDefinitions(fullConfig);
    const rootBone = this.buildBoneHierarchy(boneDefinitions);

    // Collect all bones in order
    const boneArray: THREE.Bone[] = [];
    rootBone.traverse((obj) => {
      if (obj instanceof THREE.Bone) {
        boneArray.push(obj);
      }
    });

    // Create skeleton
    const skeleton = new THREE.Skeleton(boneArray);

    return skeleton;
  }

  /**
   * Build a quadruped skeleton
   */
  buildQuadruped(length: number = 1.0, height: number = 0.6): THREE.Skeleton {
    this.bones.clear();

    const definitions: BoneDefinition[] = [
      { name: 'root', parent: null, position: new THREE.Vector3(0, height, 0) },
      { name: 'spine', parent: 'root', position: new THREE.Vector3(0, 0, 0) },
      { name: 'spine1', parent: 'spine', position: new THREE.Vector3(length * 0.25, 0, 0) },
      { name: 'spine2', parent: 'spine1', position: new THREE.Vector3(length * 0.25, 0, 0) },
      { name: 'neck', parent: 'spine2', position: new THREE.Vector3(length * 0.1, height * 0.2, 0) },
      { name: 'head', parent: 'neck', position: new THREE.Vector3(length * 0.1, height * 0.1, 0) },
      { name: 'tail', parent: 'root', position: new THREE.Vector3(-length * 0.2, 0, 0) },
      { name: 'tail1', parent: 'tail', position: new THREE.Vector3(-length * 0.15, 0, 0) },
      { name: 'tail2', parent: 'tail1', position: new THREE.Vector3(-length * 0.15, 0, 0) },
      // Front legs
      { name: 'frontLeftLeg', parent: 'spine2', position: new THREE.Vector3(0, 0, height * 0.3) },
      { name: 'frontLeftLowerLeg', parent: 'frontLeftLeg', position: new THREE.Vector3(0, -height * 0.5, 0) },
      { name: 'frontLeftFoot', parent: 'frontLeftLowerLeg', position: new THREE.Vector3(0, -height * 0.4, 0) },
      { name: 'frontRightLeg', parent: 'spine2', position: new THREE.Vector3(0, 0, -height * 0.3) },
      { name: 'frontRightLowerLeg', parent: 'frontRightLeg', position: new THREE.Vector3(0, -height * 0.5, 0) },
      { name: 'frontRightFoot', parent: 'frontRightLowerLeg', position: new THREE.Vector3(0, -height * 0.4, 0) },
      // Back legs
      { name: 'backLeftLeg', parent: 'root', position: new THREE.Vector3(0, 0, height * 0.3) },
      { name: 'backLeftLowerLeg', parent: 'backLeftLeg', position: new THREE.Vector3(0, -height * 0.5, 0) },
      { name: 'backLeftFoot', parent: 'backLeftLowerLeg', position: new THREE.Vector3(0, -height * 0.4, 0) },
      { name: 'backRightLeg', parent: 'root', position: new THREE.Vector3(0, 0, -height * 0.3) },
      { name: 'backRightLowerLeg', parent: 'backRightLeg', position: new THREE.Vector3(0, -height * 0.5, 0) },
      { name: 'backRightFoot', parent: 'backRightLowerLeg', position: new THREE.Vector3(0, -height * 0.4, 0) },
    ];

    const rootBone = this.buildBoneHierarchy(definitions);

    const boneArray: THREE.Bone[] = [];
    rootBone.traverse((obj) => {
      if (obj instanceof THREE.Bone) {
        boneArray.push(obj);
      }
    });

    return new THREE.Skeleton(boneArray);
  }

  /**
   * Get humanoid bone definitions based on config
   */
  private getHumanoidBoneDefinitions(config: SkeletonConfig): BoneDefinition[] {
    const h = config.height;
    const legHeight = h * config.proportions.legRatio;
    const torsoHeight = h * config.proportions.torsoRatio;
    const armLength = h * config.proportions.armRatio;
    const sw = config.shoulderWidth;
    const hw = config.hipWidth;

    const hipY = legHeight;
    const spineY = hipY + torsoHeight * 0.33;
    const spine1Y = hipY + torsoHeight * 0.66;
    const spine2Y = hipY + torsoHeight;
    const neckY = spine2Y + torsoHeight * 0.1;
    const headY = neckY + h * config.proportions.headRatio * 0.5;

    const upperLegLen = legHeight * 0.5;
    const lowerLegLen = legHeight * 0.5;
    const upperArmLen = armLength * 0.5;
    const lowerArmLen = armLength * 0.5;

    return [
      // Core
      { name: HUMANOID_BONES.ROOT, parent: null, position: new THREE.Vector3(0, 0, 0) },
      { name: HUMANOID_BONES.HIPS, parent: HUMANOID_BONES.ROOT, position: new THREE.Vector3(0, hipY, 0) },
      { name: HUMANOID_BONES.SPINE, parent: HUMANOID_BONES.HIPS, position: new THREE.Vector3(0, spineY - hipY, 0) },
      { name: HUMANOID_BONES.SPINE1, parent: HUMANOID_BONES.SPINE, position: new THREE.Vector3(0, spine1Y - spineY, 0) },
      { name: HUMANOID_BONES.SPINE2, parent: HUMANOID_BONES.SPINE1, position: new THREE.Vector3(0, spine2Y - spine1Y, 0) },
      { name: HUMANOID_BONES.NECK, parent: HUMANOID_BONES.SPINE2, position: new THREE.Vector3(0, neckY - spine2Y, 0) },
      { name: HUMANOID_BONES.HEAD, parent: HUMANOID_BONES.NECK, position: new THREE.Vector3(0, headY - neckY, 0) },

      // Left arm
      { name: HUMANOID_BONES.LEFT_SHOULDER, parent: HUMANOID_BONES.SPINE2, position: new THREE.Vector3(-sw * 0.3, 0, 0) },
      { name: HUMANOID_BONES.LEFT_ARM, parent: HUMANOID_BONES.LEFT_SHOULDER, position: new THREE.Vector3(-sw * 0.2, 0, 0) },
      { name: HUMANOID_BONES.LEFT_FOREARM, parent: HUMANOID_BONES.LEFT_ARM, position: new THREE.Vector3(0, -upperArmLen, 0) },
      { name: HUMANOID_BONES.LEFT_HAND, parent: HUMANOID_BONES.LEFT_FOREARM, position: new THREE.Vector3(0, -lowerArmLen, 0) },

      // Right arm
      { name: HUMANOID_BONES.RIGHT_SHOULDER, parent: HUMANOID_BONES.SPINE2, position: new THREE.Vector3(sw * 0.3, 0, 0) },
      { name: HUMANOID_BONES.RIGHT_ARM, parent: HUMANOID_BONES.RIGHT_SHOULDER, position: new THREE.Vector3(sw * 0.2, 0, 0) },
      { name: HUMANOID_BONES.RIGHT_FOREARM, parent: HUMANOID_BONES.RIGHT_ARM, position: new THREE.Vector3(0, -upperArmLen, 0) },
      { name: HUMANOID_BONES.RIGHT_HAND, parent: HUMANOID_BONES.RIGHT_FOREARM, position: new THREE.Vector3(0, -lowerArmLen, 0) },

      // Left leg
      { name: HUMANOID_BONES.LEFT_UPLEG, parent: HUMANOID_BONES.HIPS, position: new THREE.Vector3(-hw, 0, 0) },
      { name: HUMANOID_BONES.LEFT_LEG, parent: HUMANOID_BONES.LEFT_UPLEG, position: new THREE.Vector3(0, -upperLegLen, 0) },
      { name: HUMANOID_BONES.LEFT_FOOT, parent: HUMANOID_BONES.LEFT_LEG, position: new THREE.Vector3(0, -lowerLegLen, 0) },
      { name: HUMANOID_BONES.LEFT_TOE, parent: HUMANOID_BONES.LEFT_FOOT, position: new THREE.Vector3(0, 0, 0.1) },

      // Right leg
      { name: HUMANOID_BONES.RIGHT_UPLEG, parent: HUMANOID_BONES.HIPS, position: new THREE.Vector3(hw, 0, 0) },
      { name: HUMANOID_BONES.RIGHT_LEG, parent: HUMANOID_BONES.RIGHT_UPLEG, position: new THREE.Vector3(0, -upperLegLen, 0) },
      { name: HUMANOID_BONES.RIGHT_FOOT, parent: HUMANOID_BONES.RIGHT_LEG, position: new THREE.Vector3(0, -lowerLegLen, 0) },
      { name: HUMANOID_BONES.RIGHT_TOE, parent: HUMANOID_BONES.RIGHT_FOOT, position: new THREE.Vector3(0, 0, 0.1) },
    ];
  }

  /**
   * Build bone hierarchy from definitions
   */
  private buildBoneHierarchy(definitions: BoneDefinition[]): THREE.Bone {
    // Create all bones first
    for (const def of definitions) {
      const bone = new THREE.Bone();
      bone.name = def.name;
      bone.position.copy(def.position);
      if (def.rotation) {
        bone.rotation.copy(def.rotation);
      }
      this.bones.set(def.name, bone);
    }

    // Build hierarchy
    let rootBone: THREE.Bone | null = null;

    for (const def of definitions) {
      const bone = this.bones.get(def.name);
      if (!bone) continue;

      if (def.parent === null) {
        rootBone = bone;
      } else {
        const parentBone = this.bones.get(def.parent);
        if (parentBone) {
          parentBone.add(bone);
        }
      }
    }

    if (!rootBone) {
      throw new Error('No root bone found in hierarchy');
    }

    return rootBone;
  }

  /**
   * Get a bone by name from the last built skeleton
   */
  getBone(name: string): THREE.Bone | undefined {
    return this.bones.get(name);
  }

  /**
   * Create a SkinnedMesh from a geometry and skeleton
   */
  createSkinnedMesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    skeleton: THREE.Skeleton
  ): THREE.SkinnedMesh {
    const mesh = new THREE.SkinnedMesh(geometry, material);

    // Add skeleton root to mesh
    const rootBone = skeleton.bones[0];
    if (rootBone) {
      mesh.add(rootBone);
    }

    mesh.bind(skeleton);

    return mesh;
  }

  /**
   * Auto-skin a geometry based on bone positions
   * Simple distance-based skinning
   */
  autoSkin(geometry: THREE.BufferGeometry, skeleton: THREE.Skeleton, maxInfluences: number = 4): void {
    const positions = geometry.getAttribute('position');
    if (!positions) return;

    const vertexCount = positions.count;
    const boneCount = skeleton.bones.length;

    // Calculate world positions of bones
    const bonePositions: THREE.Vector3[] = [];
    for (const bone of skeleton.bones) {
      const worldPos = new THREE.Vector3();
      bone.getWorldPosition(worldPos);
      bonePositions.push(worldPos);
    }

    // Create skinning attributes
    const skinIndices: number[] = [];
    const skinWeights: number[] = [];

    const vertex = new THREE.Vector3();

    for (let i = 0; i < vertexCount; i++) {
      vertex.fromBufferAttribute(positions, i);

      // Calculate distances to all bones
      const distances: Array<{ index: number; distance: number }> = [];
      for (let j = 0; j < boneCount; j++) {
        const bonePos = bonePositions[j];
        if (bonePos) {
          distances.push({
            index: j,
            distance: vertex.distanceTo(bonePos),
          });
        }
      }

      // Sort by distance and take closest bones
      distances.sort((a, b) => a.distance - b.distance);
      const closest = distances.slice(0, maxInfluences);

      // Calculate weights (inverse distance)
      let totalWeight = 0;
      const weights: number[] = [];

      for (const entry of closest) {
        const weight = 1 / (entry.distance + 0.001);
        weights.push(weight);
        totalWeight += weight;
      }

      // Normalize weights and add to arrays
      for (let j = 0; j < maxInfluences; j++) {
        const entry = closest[j];
        const weight = weights[j];
        if (entry && weight !== undefined) {
          skinIndices.push(entry.index);
          skinWeights.push(weight / totalWeight);
        } else {
          skinIndices.push(0);
          skinWeights.push(0);
        }
      }
    }

    // Set attributes
    geometry.setAttribute(
      'skinIndex',
      new THREE.Uint16BufferAttribute(skinIndices, maxInfluences)
    );
    geometry.setAttribute(
      'skinWeight',
      new THREE.Float32BufferAttribute(skinWeights, maxInfluences)
    );
  }

  /**
   * Create skeleton helper for visualization
   */
  createHelper(skeleton: THREE.Skeleton): THREE.SkeletonHelper {
    const rootBone = skeleton.bones[0];
    if (!rootBone) {
      throw new Error('Skeleton has no bones');
    }
    return new THREE.SkeletonHelper(rootBone);
  }
}

// Export singleton
let globalSkeletonBuilder: SkeletonBuilder | null = null;

export function getSkeletonBuilder(): SkeletonBuilder {
  if (!globalSkeletonBuilder) {
    globalSkeletonBuilder = new SkeletonBuilder();
  }
  return globalSkeletonBuilder;
}
