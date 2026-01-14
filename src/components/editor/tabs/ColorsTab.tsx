'use client';

import { useCharacterStore } from '@/store/characterStore';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Slider } from '@/components/ui/Slider';
import { formatBodyPart } from '@/lib/utils';
import type { BodyPart } from '@/types/character';

const BODY_PARTS: BodyPart[] = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];

// Preset color palettes
const COLOR_PRESETS = [
  { name: 'Cyber Teal', colors: ['#00C49A', '#1a1a25', '#00ffff'] },
  { name: 'Neon Pink', colors: ['#ff00ff', '#1a1a25', '#ff69b4'] },
  { name: 'Electric Blue', colors: ['#0066ff', '#1a1a25', '#00ffff'] },
  { name: 'Warning Red', colors: ['#ff3333', '#1a1a25', '#ff6666'] },
  { name: 'Stealth Gray', colors: ['#3a3a4a', '#1a1a25', '#5a5a6a'] },
  { name: 'Gold', colors: ['#ffd700', '#1a1a25', '#ffcc00'] },
];

export function ColorsTab() {
  const { character, selectedPart, setPartColor, setPartMaterial, setPartEmission } =
    useCharacterStore();

  const currentPart = selectedPart ? character.parts[selectedPart] : null;

  return (
    <div className="space-y-6">
      {/* Color Presets */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Color Presets
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                if (selectedPart) {
                  setPartColor(selectedPart, preset.colors[0]);
                }
              }}
              className="group flex flex-col items-center gap-1 p-2 border border-surface-border hover:border-accent-primary transition-colors"
              title={preset.name}
            >
              <div className="flex gap-0.5">
                {preset.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono text-text-muted group-hover:text-accent-primary truncate w-full text-center">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Part Colors */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Part Colors
        </h3>
        <div className="space-y-3">
          {BODY_PARTS.map((part) => (
            <ColorPicker
              key={part}
              label={formatBodyPart(part)}
              value={character.parts[part].color}
              onChange={(color) => setPartColor(part, color)}
            />
          ))}
        </div>
      </section>

      {/* Material Properties (when selected) */}
      {selectedPart && currentPart && (
        <>
          <section>
            <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
              Material Properties
            </h3>
            <div className="space-y-4">
              <Slider
                label="Metalness"
                value={currentPart.metalness}
                min={0}
                max={1}
                onChange={(value) =>
                  setPartMaterial(selectedPart, value, currentPart.roughness)
                }
              />
              <Slider
                label="Roughness"
                value={currentPart.roughness}
                min={0}
                max={1}
                onChange={(value) =>
                  setPartMaterial(selectedPart, currentPart.metalness, value)
                }
              />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
              Emission (Glow)
            </h3>
            <div className="space-y-4">
              <ColorPicker
                label="Emission Color"
                value={currentPart.emission}
                onChange={(color) =>
                  setPartEmission(selectedPart, color, currentPart.emissionIntensity)
                }
              />
              <Slider
                label="Intensity"
                value={currentPart.emissionIntensity}
                min={0}
                max={2}
                onChange={(value) =>
                  setPartEmission(selectedPart, currentPart.emission, value)
                }
              />
            </div>
          </section>
        </>
      )}

      {!selectedPart && (
        <div className="text-center py-8 text-text-muted">
          <p className="text-sm">Select a body part to edit its material</p>
        </div>
      )}
    </div>
  );
}
