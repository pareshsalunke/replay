import { create } from 'zustand';
import type { ChatMessage, GrammarTarget } from '@/types';

interface GrammarState {
  /** Whether the grammar deep-dive drawer is open. */
  isOpen: boolean;
  /** The highlight the user clicked. */
  target: GrammarTarget | null;
  /** Practice-chat bubbles for the current target. */
  chatMessages: ChatMessage[];

  /** Open the drawer for a clicked highlight (resets the chat). */
  open: (target: GrammarTarget) => void;
  /** Close the drawer. */
  close: () => void;
  /** Append a practice-chat message. */
  addChatMessage: (msg: ChatMessage) => void;
  /** Patch an existing chat message (e.g. flip "Grading…" into a result). */
  updateChatMessage: (id: string, patch: Partial<ChatMessage>) => void;
}

export const useGrammarStore = create<GrammarState>((set) => ({
  isOpen: false,
  target: null,
  chatMessages: [],

  open: (target) => set({ isOpen: true, target, chatMessages: [] }),
  close: () => set({ isOpen: false }),
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  updateChatMessage: (id, patch) =>
    set((s) => ({
      chatMessages: s.chatMessages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
}));
