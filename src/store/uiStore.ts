import { create } from 'zustand';
import type { Session } from '@/types';

/** Visibility state for the global modals (the grammar drawer has its own store). */
interface UiState {
  settingsOpen: boolean;
  transcriptionConfigOpen: boolean;
  /** Non-null while the post-session summary modal is shown. */
  summarySession: Session | null;

  openSettings: () => void;
  closeSettings: () => void;
  openTranscriptionConfig: () => void;
  closeTranscriptionConfig: () => void;
  showSummary: (session: Session) => void;
  closeSummary: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  settingsOpen: false,
  transcriptionConfigOpen: false,
  summarySession: null,

  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  openTranscriptionConfig: () => set({ transcriptionConfigOpen: true }),
  closeTranscriptionConfig: () => set({ transcriptionConfigOpen: false }),
  showSummary: (session) => set({ summarySession: session }),
  closeSummary: () => set({ summarySession: null }),
}));
