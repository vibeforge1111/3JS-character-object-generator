'use client';

import { useCharacterStore } from '@/store/characterStore';
import { Slider } from '@/components/ui/Slider';
import { formatBodyPart, cn } from '@/lib/utils';
import type { BodyPart, CharacterStyle } from '@/types/character';

const BODY_PARTS: BodyPart[] = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
const STYLES: CharacterStyle[] = ['robot', 'humanoid', 'alien', 'cyborg'];

export function PartsTab() {
  const { character, selectedPart, setSelectedPart, setCharacterStyle, setPartScale } =
    useCharacterStore();

  return (
    <div className="space-y-6">
      {/* Character Style */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Character Style
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map((style) => (
            <button
              key={style}
              onClick={() => setCharacterStyle(style)}
              className={cn(
                'py-2 px-3 font-mono text-xs uppercase border transition-colors',
                character.style === style
                  ? 'border-accent-primary text-accent-primary bg-accent-primary/10'
                  : 'border-surface-border text-text-secondary hover:border-surface-hover'
              )}
            >
              {style}
            </button>
          ))}
        </div>
      </section>

      {/* Body Parts Selection */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Body Parts
        </h3>
        <div className="space-y-1">
          {BODY_PARTS.map((part) => (
            <button
              key={part}
              onClick={() => setSelectedPart(part)}
              className={cn(
                'w-full py-2 px-3 text-left font-mono text-sm border transition-colors flex items-center justify-between',
                selectedPart === part
                  ? 'border-accent-primary text-accent-primary bg-accent-primary/10'
                  : 'border-surface-border text-text-secondary hover:border-surface-hover'
              )}
            >
              <span>{formatBodyPart(part)}</span>
              <span
                className="w-4 h-4"
                style={{ backgroundColor: character.parts[part].color }}
              />
            </button>
          ))}
        </div>
      </section>

      {/* Part Scale (when selected) */}
      {selectedPart && (
        <section>
          <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
            {formatBodyPart(selectedPart)} Scale
          </h3>
          <div className="space-y-4">
            <Slider
              label="Width (X)"
              value={character.parts[selectedPart].scale.x}
              min={0.5}
              max={2}
              onChange={(value) => setPartScale(selectedPart, 'x', value)}
            />
            <Slider
              label="Height (Y)"
              value={character.parts[selectedPart].scale.y}
              min={0.5}
              max={2}
              onChange={(value) => setPartScale(selectedPart, 'y', value)}
            />
            <Slider
              label="Depth (Z)"
              value={character.parts[selectedPart].scale.z}
              min={0.5}
              max={2}
              onChange={(value) => setPartScale(selectedPart, 'z', value)}
            />
          </div>
        </section>
      )}
    </div>
  );
}
