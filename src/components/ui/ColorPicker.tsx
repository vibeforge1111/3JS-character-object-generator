'use client';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-mono text-text-muted uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-text-secondary">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 cursor-pointer"
        />
      </div>
    </div>
  );
}
