import { create } from 'zustand';
import type { Session } from '@/types';
import { loadSessions, saveSessions } from '@/services/storage';

interface SessionsState {
  sessions: Session[];
  /** The session currently open in Transcript Studio. */
  currentSession: Session | null;

  /** Load persisted sessions into the store (call once at startup). */
  loadFromStorage: () => void;
  /** Insert a new session or replace an existing one by id; persists. */
  addOrUpdate: (session: Session) => void;
  /** Look up a session by id. */
  getById: (id: string) => Session | undefined;
  /** Set the session open in Transcript Studio. */
  setCurrent: (session: Session | null) => void;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  currentSession: null,

  loadFromStorage: () => set({ sessions: loadSessions() }),

  addOrUpdate: (session) => {
    const existing = get().sessions;
    const idx = existing.findIndex((s) => s.id === session.id);
    const sessions =
      idx >= 0
        ? existing.map((s) => (s.id === session.id ? session : s))
        : [session, ...existing];
    saveSessions(sessions);
    set({ sessions });
  },

  getById: (id) => get().sessions.find((s) => s.id === id),

  setCurrent: (session) => set({ currentSession: session }),
}));
