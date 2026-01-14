/**
 * Rigging and Animation system exports
 */

export {
  SkeletonBuilder,
  getSkeletonBuilder,
  HUMANOID_BONES,
} from './SkeletonBuilder.js';
export type {
  BoneDefinition,
  SkeletonConfig,
} from './SkeletonBuilder.js';

export {
  AnimationBuilder,
  getAnimationBuilder,
} from './AnimationBuilder.js';
export type {
  Keyframe,
  TrackDefinition,
  AnimationPreset,
} from './AnimationBuilder.js';
