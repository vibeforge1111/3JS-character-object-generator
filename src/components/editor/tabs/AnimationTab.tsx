'use client';

import { useCharacterStore } from '@/store/characterStore';
import { Toggle } from '@/components/ui/Toggle';

export function AnimationTab() {
  const { character, toggleAnimation } = useCharacterStore();
  const { animation } = character;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Animation Controls
        </h3>
        <div className="space-y-4">
          <div className="p-4 border border-surface-border space-y-4">
            <Toggle
              label="Idle Breathing"
              checked={animation.idle}
              onChange={() => toggleAnimation('idle')}
            />
            <p className="text-xs text-text-muted">
              Subtle breathing animation that gives life to the character
            </p>
          </div>

          <div className="p-4 border border-surface-border space-y-4">
            <Toggle
              label="Auto Rotate"
              checked={animation.rotate}
              onChange={() => toggleAnimation('rotate')}
            />
            <p className="text-xs text-text-muted">
              Slowly rotate the character for a showcase effect
            </p>
          </div>

          <div className="p-4 border border-surface-border space-y-4">
            <Toggle
              label="Bounce"
              checked={animation.bounce}
              onChange={() => toggleAnimation('bounce')}
            />
            <p className="text-xs text-text-muted">
              Bouncy animation for a playful character
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Animation Preview
        </h3>
        <div className="p-4 border border-surface-border">
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-3 h-3 ${animation.idle ? 'bg-accent-primary' : 'bg-surface-border'}`}
              />
              <span className="text-[10px] font-mono text-text-muted">IDLE</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-3 h-3 ${animation.rotate ? 'bg-accent-primary' : 'bg-surface-border'}`}
              />
              <span className="text-[10px] font-mono text-text-muted">ROT</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-3 h-3 ${animation.bounce ? 'bg-accent-primary' : 'bg-surface-border'}`}
              />
              <span className="text-[10px] font-mono text-text-muted">BNCE</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Presets
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              useCharacterStore.setState((state) => ({
                character: {
                  ...state.character,
                  animation: { idle: true, rotate: false, bounce: false },
                },
              }));
            }}
            className="btn text-xs"
          >
            Statue
          </button>
          <button
            onClick={() => {
              useCharacterStore.setState((state) => ({
                character: {
                  ...state.character,
                  animation: { idle: true, rotate: true, bounce: false },
                },
              }));
            }}
            className="btn text-xs"
          >
            Showcase
          </button>
          <button
            onClick={() => {
              useCharacterStore.setState((state) => ({
                character: {
                  ...state.character,
                  animation: { idle: true, rotate: false, bounce: true },
                },
              }));
            }}
            className="btn text-xs"
          >
            Playful
          </button>
          <button
            onClick={() => {
              useCharacterStore.setState((state) => ({
                character: {
                  ...state.character,
                  animation: { idle: true, rotate: true, bounce: true },
                },
              }));
            }}
            className="btn text-xs"
          >
            Party Mode
          </button>
        </div>
      </section>
    </div>
  );
}
