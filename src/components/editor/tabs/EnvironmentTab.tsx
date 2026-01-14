'use client';

import { useCharacterStore } from '@/store/characterStore';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Slider } from '@/components/ui/Slider';

// Environment presets
const ENV_PRESETS = [
  { name: 'Cyber Night', bg: '#0a0a0f', ambient: 0.3, spotColor: '#ffffff', spotIntensity: 1 },
  { name: 'Neon Club', bg: '#1a0a1a', ambient: 0.2, spotColor: '#ff00ff', spotIntensity: 1.5 },
  { name: 'Teal Dream', bg: '#0a1a1a', ambient: 0.4, spotColor: '#00ffff', spotIntensity: 1.2 },
  { name: 'Sunset', bg: '#1a0f0a', ambient: 0.5, spotColor: '#ff6600', spotIntensity: 0.8 },
  { name: 'Clean White', bg: '#ffffff', ambient: 0.8, spotColor: '#ffffff', spotIntensity: 0.5 },
  { name: 'Midnight', bg: '#000000', ambient: 0.1, spotColor: '#3366ff', spotIntensity: 2 },
];

export function EnvironmentTab() {
  const {
    character,
    setBackgroundColor,
    setAmbientIntensity,
    setSpotlightColor,
    setSpotlightIntensity,
  } = useCharacterStore();
  const { environment } = character;

  const applyPreset = (preset: (typeof ENV_PRESETS)[0]) => {
    setBackgroundColor(preset.bg);
    setAmbientIntensity(preset.ambient);
    setSpotlightColor(preset.spotColor);
    setSpotlightIntensity(preset.spotIntensity);
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Environment Presets
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {ENV_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-2 p-2 border border-surface-border hover:border-accent-primary transition-colors"
            >
              <div
                className="w-6 h-6 shrink-0"
                style={{ backgroundColor: preset.bg }}
              />
              <span className="text-xs font-mono text-text-secondary truncate">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Background */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Background
        </h3>
        <ColorPicker
          label="Color"
          value={environment.backgroundColor}
          onChange={setBackgroundColor}
        />
      </section>

      {/* Ambient Light */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Ambient Light
        </h3>
        <Slider
          label="Intensity"
          value={environment.ambientIntensity}
          min={0}
          max={1}
          onChange={setAmbientIntensity}
        />
      </section>

      {/* Spotlight */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Spotlight
        </h3>
        <div className="space-y-4">
          <ColorPicker
            label="Color"
            value={environment.spotlightColor}
            onChange={setSpotlightColor}
          />
          <Slider
            label="Intensity"
            value={environment.spotlightIntensity}
            min={0}
            max={3}
            onChange={setSpotlightIntensity}
          />
        </div>
      </section>

      {/* Current Settings Display */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Current Settings
        </h3>
        <div className="p-3 border border-surface-border font-mono text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-text-muted">Background:</span>
            <span className="text-text-secondary">{environment.backgroundColor}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Ambient:</span>
            <span className="text-text-secondary">{environment.ambientIntensity.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Spotlight:</span>
            <span className="text-text-secondary">{environment.spotlightColor}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Spot Int:</span>
            <span className="text-text-secondary">{environment.spotlightIntensity.toFixed(2)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
