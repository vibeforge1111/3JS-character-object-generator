'use client';

import { useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid } from '@react-three/drei';
import { useCharacterStore } from '@/store/characterStore';
import { CharacterModel } from './CharacterModel';
import type { BodyPart } from '@/types/character';

export function CharacterCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { character, selectedPart, setSelectedPart } = useCharacterStore();
  const { environment } = character;

  const handlePartClick = useCallback((part: BodyPart) => {
    setSelectedPart(part);
  }, [setSelectedPart]);

  const handleBackgroundClick = useCallback(() => {
    setSelectedPart(null);
  }, [setSelectedPart]);

  return (
    <div className="w-full h-full canvas-container">
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 2, 5], fov: 50 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        onPointerMissed={handleBackgroundClick}
      >
        {/* Background color */}
        <color attach="background" args={[environment.backgroundColor]} />

        {/* Lighting */}
        <ambientLight intensity={environment.ambientIntensity} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.3}
          penumbra={1}
          intensity={environment.spotlightIntensity}
          color={environment.spotlightColor}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
        <pointLight position={[10, -5, 10]} intensity={0.3} color="#00ffff" />

        {/* Character */}
        <CharacterModel
          config={character}
          selectedPart={selectedPart}
          onPartClick={handlePartClick}
        />

        {/* Environment */}
        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.5}
          scale={10}
          blur={2}
          far={4}
        />

        {/* Grid */}
        <Grid
          position={[0, -1.5, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#1a1a25"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#00C49A"
          fadeDistance={30}
          fadeStrength={1}
          infiniteGrid
        />

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={15}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0.5, 0]}
        />

        {/* Environment map for reflections */}
        <Environment preset="city" />
      </Canvas>

      {/* Canvas overlay info */}
      <div className="absolute bottom-4 left-4 font-mono text-xs text-text-muted">
        <p>Drag to rotate | Scroll to zoom | Shift+drag to pan</p>
        <p>Click a body part to select it</p>
      </div>
    </div>
  );
}
