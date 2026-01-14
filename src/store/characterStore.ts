import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { CharacterConfig, BodyPart, PartConfig, CharacterStyle } from '@/types/character';
import { DEFAULT_CHARACTER_CONFIG } from '@/types/character';

interface CharacterState {
  // Current character being edited
  character: CharacterConfig;

  // Selected part for editing
  selectedPart: BodyPart | null;

  // Editor state
  editorTab: 'reference' | 'parts' | 'colors' | 'animation' | 'environment' | 'export';

  // History for undo/redo
  history: CharacterConfig[];
  historyIndex: number;

  // Actions
  setCharacter: (config: CharacterConfig) => void;
  resetCharacter: () => void;
  setSelectedPart: (part: BodyPart | null) => void;
  setEditorTab: (tab: CharacterState['editorTab']) => void;

  // Part actions
  updatePart: (part: BodyPart, updates: Partial<PartConfig>) => void;
  setPartColor: (part: BodyPart, color: string) => void;
  setPartScale: (part: BodyPart, axis: 'x' | 'y' | 'z', value: number) => void;
  setPartMaterial: (part: BodyPart, metalness: number, roughness: number) => void;
  setPartEmission: (part: BodyPart, color: string, intensity: number) => void;

  // Style actions
  setCharacterStyle: (style: CharacterStyle) => void;
  setCharacterName: (name: string) => void;

  // Animation actions
  toggleAnimation: (type: 'idle' | 'rotate' | 'bounce') => void;

  // Environment actions
  setBackgroundColor: (color: string) => void;
  setAmbientIntensity: (intensity: number) => void;
  setSpotlightColor: (color: string) => void;
  setSpotlightIntensity: (intensity: number) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
}

const createNewCharacter = (): CharacterConfig => ({
  id: uuidv4(),
  ...DEFAULT_CHARACTER_CONFIG,
});

export const useCharacterStore = create<CharacterState>((set, get) => ({
  character: createNewCharacter(),
  selectedPart: null,
  editorTab: 'reference',
  history: [],
  historyIndex: -1,

  setCharacter: (config) => {
    get().saveToHistory();
    set({ character: config });
  },

  resetCharacter: () => {
    get().saveToHistory();
    set({ character: createNewCharacter(), selectedPart: null });
  },

  setSelectedPart: (part) => set({ selectedPart: part }),

  setEditorTab: (tab) => set({ editorTab: tab }),

  updatePart: (part, updates) => {
    get().saveToHistory();
    set((state) => ({
      character: {
        ...state.character,
        parts: {
          ...state.character.parts,
          [part]: { ...state.character.parts[part], ...updates },
        },
      },
    }));
  },

  setPartColor: (part, color) => {
    get().updatePart(part, { color });
  },

  setPartScale: (part, axis, value) => {
    const currentScale = get().character.parts[part].scale;
    get().updatePart(part, {
      scale: { ...currentScale, [axis]: value },
    });
  },

  setPartMaterial: (part, metalness, roughness) => {
    get().updatePart(part, { metalness, roughness });
  },

  setPartEmission: (part, color, intensity) => {
    get().updatePart(part, { emission: color, emissionIntensity: intensity });
  },

  setCharacterStyle: (style) => {
    get().saveToHistory();
    set((state) => ({
      character: { ...state.character, style },
    }));
  },

  setCharacterName: (name) => {
    set((state) => ({
      character: { ...state.character, name },
    }));
  },

  toggleAnimation: (type) => {
    set((state) => ({
      character: {
        ...state.character,
        animation: {
          ...state.character.animation,
          [type]: !state.character.animation[type],
        },
      },
    }));
  },

  setBackgroundColor: (color) => {
    set((state) => ({
      character: {
        ...state.character,
        environment: { ...state.character.environment, backgroundColor: color },
      },
    }));
  },

  setAmbientIntensity: (intensity) => {
    set((state) => ({
      character: {
        ...state.character,
        environment: { ...state.character.environment, ambientIntensity: intensity },
      },
    }));
  },

  setSpotlightColor: (color) => {
    set((state) => ({
      character: {
        ...state.character,
        environment: { ...state.character.environment, spotlightColor: color },
      },
    }));
  },

  setSpotlightIntensity: (intensity) => {
    set((state) => ({
      character: {
        ...state.character,
        environment: { ...state.character.environment, spotlightIntensity: intensity },
      },
    }));
  },

  saveToHistory: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ ...state.character });
      return {
        history: newHistory.slice(-50), // Keep last 50 states
        historyIndex: newHistory.length - 1,
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        character: { ...state.history[newIndex] },
        historyIndex: newIndex,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        character: { ...state.history[newIndex] },
        historyIndex: newIndex,
      };
    });
  },
}));
