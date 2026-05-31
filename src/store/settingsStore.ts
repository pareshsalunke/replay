import { create } from 'zustand';
import type { Settings } from '@/types';
import { loadSettings, saveSettings } from '@/services/storage';

interface SettingsState extends Settings {
  /** Load persisted settings into the store (call once at startup). */
  loadFromStorage: () => void;
  /** Merge a partial update, persist the full settings, update the store. */
  save: (partial: Partial<Settings>) => void;
}

const DEFAULTS: Settings = {
  localStorageOnly: false,
  autoDetect: false,
  exportFormat: 'md',
  userCefr: 'B1',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,

  loadFromStorage: () => set(loadSettings()),

  save: (partial) => {
    const current = get();
    const next: Settings = {
      localStorageOnly: current.localStorageOnly,
      autoDetect: current.autoDetect,
      exportFormat: current.exportFormat,
      userCefr: current.userCefr,
      ...partial,
    };
    saveSettings(next);
    set(partial);
  },
}));
