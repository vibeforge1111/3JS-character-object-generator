/**
 * AnimationBuilder - Create and manage animations for characters
 * Following H70 animation-systems patterns
 */

import * as THREE from 'three';
import { HUMANOID_BONES } from './SkeletonBuilder.js';

/**
 * Keyframe definition
 */
export interface Keyframe {
  time: number;
  value: number | THREE.Vector3 | THREE.Quaternion;
}

/**
 * Track definition for building animations
 */
export interface TrackDefinition {
  boneName: string;
  property: 'position' | 'quaternion' | 'scale';
  keyframes: Keyframe[];
}

/**
 * Animation preset types
 */
export type AnimationPreset = 'idle' | 'walk' | 'run' | 'jump' | 'attack' | 'hit' | 'death';

/**
 * AnimationBuilder - Creates animation clips
 */
export class AnimationBuilder {
  /**
   * Build an animation clip from track definitions
   */
  build(name: string, duration: number, tracks: TrackDefinition[]): THREE.AnimationClip {
    const keyframeTracks: THREE.KeyframeTrack[] = [];

    for (const track of tracks) {
      const trackName = `${track.boneName}.${track.property}`;
      const times: number[] = [];
      const values: number[] = [];

      for (const kf of track.keyframes) {
        times.push(kf.time);

        if (track.property === 'quaternion') {
          const quat = kf.value as THREE.Quaternion;
          values.push(quat.x, quat.y, quat.z, quat.w);
        } else if (track.property === 'position' || track.property === 'scale') {
          const vec = kf.value as THREE.Vector3;
          values.push(vec.x, vec.y, vec.z);
        }
      }

      let keyframeTrack: THREE.KeyframeTrack;
      if (track.property === 'quaternion') {
        keyframeTrack = new THREE.QuaternionKeyframeTrack(trackName, times, values);
      } else {
        keyframeTrack = new THREE.VectorKeyframeTrack(trackName, times, values);
      }

      keyframeTracks.push(keyframeTrack);
    }

    return new THREE.AnimationClip(name, duration, keyframeTracks);
  }

  /**
   * Create a preset animation for humanoid characters
   */
  createHumanoidAnimation(preset: AnimationPreset): THREE.AnimationClip {
    switch (preset) {
      case 'idle':
        return this.createIdleAnimation();
      case 'walk':
        return this.createWalkAnimation();
      case 'run':
        return this.createRunAnimation();
      case 'jump':
        return this.createJumpAnimation();
      case 'attack':
        return this.createAttackAnimation();
      case 'hit':
        return this.createHitAnimation();
      case 'death':
        return this.createDeathAnimation();
      default:
        return this.createIdleAnimation();
    }
  }

  /**
   * Create idle breathing animation
   */
  private createIdleAnimation(): THREE.AnimationClip {
    const duration = 2.0;

    const tracks: TrackDefinition[] = [
      // Subtle spine breathing motion
      {
        boneName: HUMANOID_BONES.SPINE,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.02, 0, 0)) },
          { time: 2, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
      // Slight head movement
      {
        boneName: HUMANOID_BONES.HEAD,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.01, 0.02, 0)) },
          { time: 1.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.01, -0.02, 0)) },
          { time: 2, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
    ];

    return this.build('idle', duration, tracks);
  }

  /**
   * Create walk cycle animation
   */
  private createWalkAnimation(): THREE.AnimationClip {
    const duration = 1.0;
    const stepAngle = 0.4;
    const armSwing = 0.3;

    const tracks: TrackDefinition[] = [
      // Left leg
      {
        boneName: HUMANOID_BONES.LEFT_UPLEG,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-stepAngle, 0, 0)) },
          { time: 0.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle, 0, 0)) },
          { time: 1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-stepAngle, 0, 0)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.LEFT_LEG,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle * 0.5, 0, 0)) },
          { time: 0.25, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle, 0, 0)) },
          { time: 0.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.75, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle * 0.5, 0, 0)) },
        ],
      },
      // Right leg (opposite phase)
      {
        boneName: HUMANOID_BONES.RIGHT_UPLEG,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle, 0, 0)) },
          { time: 0.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-stepAngle, 0, 0)) },
          { time: 1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle, 0, 0)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.RIGHT_LEG,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.25, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle * 0.5, 0, 0)) },
          { time: 0.75, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle, 0, 0)) },
          { time: 1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
      // Arms swing (opposite to legs)
      {
        boneName: HUMANOID_BONES.LEFT_ARM,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(armSwing, 0, 0)) },
          { time: 0.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-armSwing, 0, 0)) },
          { time: 1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(armSwing, 0, 0)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.RIGHT_ARM,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-armSwing, 0, 0)) },
          { time: 0.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(armSwing, 0, 0)) },
          { time: 1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-armSwing, 0, 0)) },
        ],
      },
      // Body bob
      {
        boneName: HUMANOID_BONES.HIPS,
        property: 'position',
        keyframes: [
          { time: 0, value: new THREE.Vector3(0, 0, 0) },
          { time: 0.25, value: new THREE.Vector3(0, 0.02, 0) },
          { time: 0.5, value: new THREE.Vector3(0, 0, 0) },
          { time: 0.75, value: new THREE.Vector3(0, 0.02, 0) },
          { time: 1, value: new THREE.Vector3(0, 0, 0) },
        ],
      },
    ];

    return this.build('walk', duration, tracks);
  }

  /**
   * Create run cycle animation
   */
  private createRunAnimation(): THREE.AnimationClip {
    const duration = 0.6;
    const stepAngle = 0.6;
    const armSwing = 0.5;

    const tracks: TrackDefinition[] = [
      // Left leg - bigger swing
      {
        boneName: HUMANOID_BONES.LEFT_UPLEG,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-stepAngle, 0, 0)) },
          { time: 0.3, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle, 0, 0)) },
          { time: 0.6, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-stepAngle, 0, 0)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.LEFT_LEG,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle * 0.8, 0, 0)) },
          { time: 0.15, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle * 1.2, 0, 0)) },
          { time: 0.3, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.6, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle * 0.8, 0, 0)) },
        ],
      },
      // Right leg
      {
        boneName: HUMANOID_BONES.RIGHT_UPLEG,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle, 0, 0)) },
          { time: 0.3, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-stepAngle, 0, 0)) },
          { time: 0.6, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle, 0, 0)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.RIGHT_LEG,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.3, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle * 0.8, 0, 0)) },
          { time: 0.45, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(stepAngle * 1.2, 0, 0)) },
          { time: 0.6, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
      // Arms
      {
        boneName: HUMANOID_BONES.LEFT_ARM,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(armSwing, 0, 0)) },
          { time: 0.3, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-armSwing, 0, 0)) },
          { time: 0.6, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(armSwing, 0, 0)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.RIGHT_ARM,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-armSwing, 0, 0)) },
          { time: 0.3, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(armSwing, 0, 0)) },
          { time: 0.6, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-armSwing, 0, 0)) },
        ],
      },
      // Torso lean forward
      {
        boneName: HUMANOID_BONES.SPINE,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0, 0)) },
          { time: 0.3, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0, 0)) },
          { time: 0.6, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0, 0)) },
        ],
      },
    ];

    return this.build('run', duration, tracks);
  }

  /**
   * Create jump animation
   */
  private createJumpAnimation(): THREE.AnimationClip {
    const duration = 0.8;

    const tracks: TrackDefinition[] = [
      // Crouch then extend
      {
        boneName: HUMANOID_BONES.LEFT_UPLEG,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.2, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.8, 0, 0)) },
          { time: 0.4, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0, 0)) },
          { time: 0.8, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.RIGHT_UPLEG,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.2, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.8, 0, 0)) },
          { time: 0.4, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0, 0)) },
          { time: 0.8, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
      // Arms up
      {
        boneName: HUMANOID_BONES.LEFT_ARM,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.2, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, 0, 0)) },
          { time: 0.4, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-2.5, 0, 0.3)) },
          { time: 0.8, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.RIGHT_ARM,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.2, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, 0, 0)) },
          { time: 0.4, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-2.5, 0, -0.3)) },
          { time: 0.8, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
    ];

    return this.build('jump', duration, tracks);
  }

  /**
   * Create attack animation
   */
  private createAttackAnimation(): THREE.AnimationClip {
    const duration = 0.5;

    const tracks: TrackDefinition[] = [
      // Right arm punch
      {
        boneName: HUMANOID_BONES.RIGHT_ARM,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, -0.5, 0)) },
          { time: 0.25, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.5, 0, 0)) },
          { time: 0.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.RIGHT_FOREARM,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.2, 0, 0)) },
          { time: 0.25, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, 0, 0)) },
          { time: 0.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
      // Body rotation
      {
        boneName: HUMANOID_BONES.SPINE,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.3, 0)) },
          { time: 0.25, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, -0.2, 0)) },
          { time: 0.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
    ];

    return this.build('attack', duration, tracks);
  }

  /**
   * Create hit reaction animation
   */
  private createHitAnimation(): THREE.AnimationClip {
    const duration = 0.4;

    const tracks: TrackDefinition[] = [
      {
        boneName: HUMANOID_BONES.SPINE,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0, 0.1)) },
          { time: 0.2, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, 0, 0)) },
          { time: 0.4, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.HEAD,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, 0, 0)) },
          { time: 0.4, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
        ],
      },
    ];

    return this.build('hit', duration, tracks);
  }

  /**
   * Create death animation
   */
  private createDeathAnimation(): THREE.AnimationClip {
    const duration = 1.0;

    const tracks: TrackDefinition[] = [
      {
        boneName: HUMANOID_BONES.HIPS,
        property: 'position',
        keyframes: [
          { time: 0, value: new THREE.Vector3(0, 0, 0) },
          { time: 0.5, value: new THREE.Vector3(0, -0.3, 0) },
          { time: 1, value: new THREE.Vector3(0, -0.8, 0) },
        ],
      },
      {
        boneName: HUMANOID_BONES.SPINE,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, 0, 0)) },
          { time: 1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.5, 0, 0.2)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.HEAD,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 0.5, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0)) },
          { time: 1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.8, 0.3, 0)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.LEFT_ARM,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.8)) },
        ],
      },
      {
        boneName: HUMANOID_BONES.RIGHT_ARM,
        property: 'quaternion',
        keyframes: [
          { time: 0, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)) },
          { time: 1, value: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.5)) },
        ],
      },
    ];

    return this.build('death', duration, tracks);
  }

  /**
   * Get all available animation presets
   */
  getAvailablePresets(): AnimationPreset[] {
    return ['idle', 'walk', 'run', 'jump', 'attack', 'hit', 'death'];
  }
}

// Singleton
let globalAnimationBuilder: AnimationBuilder | null = null;

export function getAnimationBuilder(): AnimationBuilder {
  if (!globalAnimationBuilder) {
    globalAnimationBuilder = new AnimationBuilder();
  }
  return globalAnimationBuilder;
}
