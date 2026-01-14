'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/ui/Header';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Dynamic import for Three.js canvas to avoid SSR issues
const CharacterCanvas = dynamic(
  () => import('@/components/character/CharacterCanvas').then(mod => mod.CharacterCanvas),
  { ssr: false, loading: () => <LoadingScreen /> }
);

export default function Home() {
  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <Suspense fallback={<LoadingScreen />}>
            <CharacterCanvas />
          </Suspense>
        </div>

        {/* Editor Panel */}
        <EditorPanel />
      </div>
    </main>
  );
}
