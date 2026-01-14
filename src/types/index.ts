/**
 * Common types for the Character Generator
 */

import type { z } from 'zod';

/**
 * Result type for operations that can fail
 * Following H70 typescript-strict patterns
 */
export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/**
 * Create a success result
 */
export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

/**
 * Create a failure result
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Asset loading state
 */
export type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading'; progress: number }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

/**
 * Character body types
 */
export type BodyType = 'humanoid' | 'quadruped' | 'serpentine' | 'amorphous' | 'mechanical';

/**
 * Character skin types
 */
export type SkinType = 'organic' | 'metallic' | 'crystalline' | 'ethereal' | 'composite';

/**
 * Texture style
 */
export type TextureStyle = 'realistic' | 'stylized' | 'pixel' | 'toon';

/**
 * Rig type
 */
export type RigType = 'humanoid' | 'custom' | 'procedural';

/**
 * Character role
 */
export type CharacterRole = 'npc' | 'enemy' | 'ally' | 'neutral' | 'agent';
