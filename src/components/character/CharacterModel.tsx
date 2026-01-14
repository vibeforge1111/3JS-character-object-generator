'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CharacterConfig, BodyPart } from '@/types/character';
import { BodyPartMesh } from './BodyPartMesh';

interface CharacterModelProps {
  config: CharacterConfig;
  selectedPart: BodyPart | null;
  onPartClick: (part: BodyPart) => void;
}

// Body part positions and base sizes for robot style
const PART_GEOMETRY: Record<BodyPart, { position: [number, number, number]; size: [number, number, number] }> = {
  head: { position: [0, 1.6, 0], size: [0.6, 0.6, 0.6] },
  torso: { position: [0, 0.7, 0], size: [0.8, 1.0, 0.5] },
  leftArm: { position: [-0.6, 0.7, 0], size: [0.25, 0.8, 0.25] },
  rightArm: { position: [0.6, 0.7, 0], size: [0.25, 0.8, 0.25] },
  leftLeg: { position: [-0.25, -0.4, 0], size: [0.3, 1.0, 0.3] },
  rightLeg: { position: [0.25, -0.4, 0], size: [0.3, 1.0, 0.3] },
};

export function CharacterModel({ config, selectedPart, onPartClick }: CharacterModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { animation } = config;

  // Animation state
  const animationTime = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    animationTime.current += delta;
    const t = animationTime.current;

    // Idle breathing animation
    if (animation.idle) {
      const breathe = Math.sin(t * 2) * 0.02;
      groupRef.current.scale.setScalar(1 + breathe);
    } else {
      groupRef.current.scale.setScalar(1);
    }

    // Rotation animation
    if (animation.rotate) {
      groupRef.current.rotation.y += delta * 0.5;
    }

    // Bounce animation
    if (animation.bounce) {
      const bounce = Math.abs(Math.sin(t * 4)) * 0.1;
      groupRef.current.position.y = bounce;
    } else if (!animation.bounce && groupRef.current.position.y !== 0) {
      groupRef.current.position.y = 0;
    }
  });

  const bodyParts = useMemo(() => {
    return (Object.keys(PART_GEOMETRY) as BodyPart[]).map((part) => {
      const geometry = PART_GEOMETRY[part];
      const partConfig = config.parts[part];
      const isSelected = selectedPart === part;

      return (
        <BodyPartMesh
          key={part}
          part={part}
          config={partConfig}
          position={geometry.position}
          baseSize={geometry.size}
          isSelected={isSelected}
          onClick={() => onPartClick(part)}
          characterStyle={config.style}
        />
      );
    });
  }, [config, selectedPart, onPartClick]);

  return (
    <group ref={groupRef}>
      {bodyParts}

      {/* Connection joints */}
      <JointConnector from={PART_GEOMETRY.head.position} to={PART_GEOMETRY.torso.position} />
      <JointConnector from={PART_GEOMETRY.leftArm.position} to={PART_GEOMETRY.torso.position} />
      <JointConnector from={PART_GEOMETRY.rightArm.position} to={PART_GEOMETRY.torso.position} />
      <JointConnector from={PART_GEOMETRY.leftLeg.position} to={PART_GEOMETRY.torso.position} />
      <JointConnector from={PART_GEOMETRY.rightLeg.position} to={PART_GEOMETRY.torso.position} />
    </group>
  );
}

// Simple joint connector between body parts
function JointConnector({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const midpoint: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];

  return (
    <mesh position={midpoint}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color="#2a2a3a" metalness={0.9} roughness={0.1} />
    </mesh>
  );
}
