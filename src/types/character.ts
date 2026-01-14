export type BodyPart = 'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';

export type CharacterStyle = 'robot' | 'humanoid' | 'alien' | 'cyborg';

export interface PartConfig {
  id: string;
  type: BodyPart;
  style: string;
  color: string;
  metalness: number;
  roughness: number;
  scale: { x: number; y: number; z: number };
  emission: string;
  emissionIntensity: number;
}

export interface CharacterConfig {
  id: string;
  name: string;
  style: CharacterStyle;
  parts: Record<BodyPart, PartConfig>;
  animation: {
    idle: boolean;
    rotate: boolean;
    bounce: boolean;
  };
  environment: {
    backgroundColor: string;
    ambientIntensity: number;
    spotlightColor: string;
    spotlightIntensity: number;
  };
}

export interface CharacterPreset {
  id: string;
  name: string;
  thumbnail: string;
  config: CharacterConfig;
}

export const DEFAULT_PART_CONFIG: Omit<PartConfig, 'id' | 'type'> = {
  style: 'default',
  color: '#00C49A',
  metalness: 0.8,
  roughness: 0.2,
  scale: { x: 1, y: 1, z: 1 },
  emission: '#000000',
  emissionIntensity: 0,
};

export const DEFAULT_CHARACTER_CONFIG: Omit<CharacterConfig, 'id'> = {
  name: 'New Character',
  style: 'robot',
  parts: {
    head: { id: 'head', type: 'head', ...DEFAULT_PART_CONFIG },
    torso: { id: 'torso', type: 'torso', ...DEFAULT_PART_CONFIG, color: '#1a1a25' },
    leftArm: { id: 'leftArm', type: 'leftArm', ...DEFAULT_PART_CONFIG },
    rightArm: { id: 'rightArm', type: 'rightArm', ...DEFAULT_PART_CONFIG },
    leftLeg: { id: 'leftLeg', type: 'leftLeg', ...DEFAULT_PART_CONFIG, color: '#1a1a25' },
    rightLeg: { id: 'rightLeg', type: 'rightLeg', ...DEFAULT_PART_CONFIG, color: '#1a1a25' },
  },
  animation: {
    idle: true,
    rotate: false,
    bounce: false,
  },
  environment: {
    backgroundColor: '#0a0a0f',
    ambientIntensity: 0.3,
    spotlightColor: '#ffffff',
    spotlightIntensity: 1,
  },
};
