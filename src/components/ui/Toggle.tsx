'use client';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative w-10 h-5 transition-colors
          ${checked ? 'bg-accent-primary' : 'bg-surface-border'}
        `}
      >
        <span
          className={`
            absolute top-0.5 w-4 h-4 bg-text-primary transition-transform
            ${checked ? 'left-5' : 'left-0.5'}
          `}
        />
      </button>
    </label>
  );
}
