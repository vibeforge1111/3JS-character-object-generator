export function LoadingScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-bg-primary">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-2 border-surface-border animate-spin-slow" />

        {/* Inner glow */}
        <div className="absolute inset-2 bg-accent-primary/20 animate-pulse" />

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-accent-primary" />
        </div>
      </div>

      <p className="mt-6 font-mono text-xs text-text-muted tracking-widest uppercase">
        Initializing...
      </p>
    </div>
  );
}
