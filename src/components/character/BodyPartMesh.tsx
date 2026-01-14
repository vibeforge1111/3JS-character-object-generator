'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PartConfig, BodyPart, CharacterStyle } from '@/types/character';

interface BodyPartMeshProps {
  part: BodyPart;
  config: PartConfig;
  position: [number, number, number];
  baseSize: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
  characterStyle: CharacterStyle;
}

export function BodyPartMesh({
  part,
  config,
  position,
  baseSize,
  isSelected,
  onClick,
  characterStyle,
}: BodyPartMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const outlineRef = useRef<THREE.Mesh>(null);

  // Calculate scaled size
  const size: [number, number, number] = useMemo(
    () => [
      baseSize[0] * config.scale.x,
      baseSize[1] * config.scale.y,
      baseSize[2] * config.scale.z,
    ],
    [baseSize, config.scale]
  );

  // Selection pulse animation
  useFrame((_, delta) => {
    if (outlineRef.current && isSelected) {
      outlineRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.05);
    }
  });

  // Get geometry based on style and part
  const geometry = useMemo(() => {
    switch (characterStyle) {
      case 'robot':
        return <boxGeometry args={size} />;
      case 'humanoid':
        if (part === 'head') {
          return <sphereGeometry args={[size[0] / 2, 32, 32]} />;
        }
        return <capsuleGeometry args={[size[0] / 2, size[1] - size[0], 8, 16]} />;
      case 'alien':
        if (part === 'head') {
          return <dodecahedronGeometry args={[size[0] / 2]} />;
        }
        return <octahedronGeometry args={[size[0] / 2]} />;
      case 'cyborg':
        return <boxGeometry args={size} />;
      default:
        return <boxGeometry args={size} />;
    }
  }, [characterStyle, part, size]);

  // Determine if this part has emission
  const hasEmission = config.emissionIntensity > 0 && config.emission !== '#000000';

  return (
    <group position={position}>
      {/* Selection outline */}
      {isSelected && (
        <mesh ref={outlineRef} scale={1.1}>
          {geometry}
          <meshBasicMaterial color="#00ffff" transparent opacity={0.3} side={THREE.BackSide} />
        </mesh>
      )}

      {/* Main mesh */}
      <mesh ref={meshRef} onClick={onClick} castShadow receiveShadow>
        {geometry}
        <meshStandardMaterial
          color={config.color}
          metalness={config.metalness}
          roughness={config.roughness}
          emissive={hasEmission ? config.emission : '#000000'}
          emissiveIntensity={hasEmission ? config.emissionIntensity : 0}
        />
      </mesh>

      {/* Decorative elements for robot style */}
      {characterStyle === 'robot' && part === 'head' && (
        <>
          {/* Eyes */}
          <mesh position={[-0.15, 0.1, size[2] / 2 + 0.01]}>
            <circleGeometry args={[0.08, 16]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
          <mesh position={[0.15, 0.1, size[2] / 2 + 0.01]}>
            <circleGeometry args={[0.08, 16]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
          {/* Mouth */}
          <mesh position={[0, -0.1, size[2] / 2 + 0.01]}>
            <planeGeometry args={[0.2, 0.03]} />
            <meshBasicMaterial color="#00C49A" />
          </mesh>
        </>
      )}

      {/* Cyborg enhancements */}
      {characterStyle === 'cyborg' && (
        <mesh position={[0, 0, size[2] / 2 + 0.01]}>
          <ringGeometry args={[0.05, 0.1, 6]} />
          <meshBasicMaterial color="#ff00ff" />
        </mesh>
      )}

      {/* Alien bio-luminescence */}
      {characterStyle === 'alien' && (
        <pointLight
          position={[0, 0, 0]}
          intensity={0.5}
          color={config.color}
          distance={1}
        />
      )}
    </group>
  );
}
