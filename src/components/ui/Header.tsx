'use client';

import { useCharacterStore } from '@/store/characterStore';

export function Header() {
  const { character, resetCharacter, undo, redo, history, historyIndex } = useCharacterStore();

  return (
    <header className="h-14 bg-bg-secondary border-b border-surface-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-accent-primary text-xl font-bold">&#x25C6;</span>
        <h1 className="font-mono text-sm font-semibold tracking-wider text-text-primary uppercase">
          Character Generator
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Character Name */}
        <input
          type="text"
          value={character.name}
          onChange={(e) => useCharacterStore.getState().setCharacterName(e.target.value)}
          className="bg-transparent border border-surface-border px-3 py-1.5 text-sm font-mono text-text-secondary focus:border-accent-primary focus:outline-none w-48"
          placeholder="Character name..."
        />

        {/* Undo/Redo */}
        <div className="flex gap-1 ml-4">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="btn disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="btn disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            Redo
          </button>
        </div>

        {/* Reset */}
        <button onClick={resetCharacter} className="btn ml-2">
          Reset
        </button>
      </div>
    </header>
  );
}
