'use client';

import { useCharacterStore } from '@/store/characterStore';
import { PartsTab } from './tabs/PartsTab';
import { ColorsTab } from './tabs/ColorsTab';
import { AnimationTab } from './tabs/AnimationTab';
import { EnvironmentTab } from './tabs/EnvironmentTab';
import { ExportTab } from './tabs/ExportTab';
import { ReferenceTab } from './tabs/ReferenceTab';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'reference', label: 'Ref' },
  { id: 'parts', label: 'Parts' },
  { id: 'colors', label: 'Colors' },
  { id: 'animation', label: 'Anim' },
  { id: 'environment', label: 'Env' },
  { id: 'export', label: 'Export' },
] as const;

export function EditorPanel() {
  const { editorTab, setEditorTab } = useCharacterStore();

  return (
    <aside className="w-80 bg-bg-secondary border-l border-surface-border flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-surface-border shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setEditorTab(tab.id)}
            className={cn(
              'flex-1 py-2.5 px-2 font-mono text-xs uppercase tracking-wider transition-colors',
              editorTab === tab.id
                ? 'text-accent-primary bg-bg-tertiary border-b-2 border-accent-primary'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-tertiary/50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {editorTab === 'reference' && <ReferenceTab />}
        {editorTab === 'parts' && <PartsTab />}
        {editorTab === 'colors' && <ColorsTab />}
        {editorTab === 'animation' && <AnimationTab />}
        {editorTab === 'environment' && <EnvironmentTab />}
        {editorTab === 'export' && <ExportTab />}
      </div>
    </aside>
  );
}
