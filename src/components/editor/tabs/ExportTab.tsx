'use client';

import { useCallback, useState } from 'react';
import { useCharacterStore } from '@/store/characterStore';
import { downloadJson } from '@/lib/utils';

export function ExportTab() {
  const { character } = useCharacterStore();
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExportJson = useCallback(() => {
    try {
      downloadJson(character, `${character.name.replace(/\s+/g, '-').toLowerCase()}.json`);
      setExportStatus('JSON exported successfully!');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus('Failed to export JSON');
    }
  }, [character]);

  const handleExportScreenshot = useCallback(() => {
    try {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        setExportStatus('Canvas not found');
        return;
      }

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${character.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();

      setExportStatus('Screenshot exported successfully!');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus('Failed to export screenshot');
    }
  }, [character.name]);

  const handleCopyConfig = useCallback(() => {
    try {
      navigator.clipboard.writeText(JSON.stringify(character, null, 2));
      setExportStatus('Config copied to clipboard!');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus('Failed to copy config');
    }
  }, [character]);

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Export Options
        </h3>
        <div className="space-y-2">
          <button onClick={handleExportScreenshot} className="btn btn-primary w-full">
            Export Screenshot (PNG)
          </button>
          <button onClick={handleExportJson} className="btn w-full">
            Export Config (JSON)
          </button>
          <button onClick={handleCopyConfig} className="btn w-full">
            Copy Config to Clipboard
          </button>
        </div>
      </section>

      {/* Status Message */}
      {exportStatus && (
        <div className="p-3 border border-accent-primary bg-accent-primary/10 text-accent-primary text-xs font-mono text-center">
          {exportStatus}
        </div>
      )}

      {/* Character Summary */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Character Summary
        </h3>
        <div className="p-3 border border-surface-border font-mono text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-text-muted">Name:</span>
            <span className="text-text-secondary">{character.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Style:</span>
            <span className="text-text-secondary capitalize">{character.style}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Parts:</span>
            <span className="text-text-secondary">{Object.keys(character.parts).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">ID:</span>
            <span className="text-text-secondary truncate ml-2">{character.id.slice(0, 8)}...</span>
          </div>
        </div>
      </section>

      {/* Config Preview */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Config Preview
        </h3>
        <div className="h-48 overflow-auto p-3 border border-surface-border bg-bg-tertiary">
          <pre className="font-mono text-[10px] text-text-muted whitespace-pre-wrap">
            {JSON.stringify(character, null, 2)}
          </pre>
        </div>
      </section>

      {/* Import */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Import Config
        </h3>
        <label className="btn w-full cursor-pointer">
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const config = JSON.parse(event.target?.result as string);
                  useCharacterStore.getState().setCharacter(config);
                  setExportStatus('Config imported successfully!');
                  setTimeout(() => setExportStatus(null), 3000);
                } catch (error) {
                  setExportStatus('Failed to import config - invalid JSON');
                }
              };
              reader.readAsText(file);
            }}
          />
          Import JSON Config
        </label>
      </section>
    </div>
  );
}
