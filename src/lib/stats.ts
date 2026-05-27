import type { GrammarType, Highlight, Session } from '@/types';

/** Count highlights in a flat list, grouped by grammar type. */
export function countHighlightsByType(highlights: Highlight[]): Record<GrammarType, number> {
  const counts: Record<GrammarType, number> = {
    verb: 0,
    case: 0,
    syntax: 0,
    vocab: 0,
    lexicon: 0,
  };
  for (const h of highlights) {
    if (counts[h.type] !== undefined) counts[h.type]++;
  }
  return counts;
}

/** Flatten every highlight across a session's sentences. */
export function sessionHighlights(session: Session): Highlight[] {
  return (session.sentences || []).flatMap((s) => s.highlights || []);
}

export interface SessionTotals {
  sentences: number;
  highlights: number;
  verbs: number;
  cases: number;
  syntax: number;
  vocab: number;
}

/** Per-session counts, used by the Transcript Studio sidebar. */
export function sessionTotals(session: Session): SessionTotals {
  const hs = sessionHighlights(session);
  let verbs = 0;
  let cases = 0;
  let syntax = 0;
  let vocab = 0;
  for (const h of hs) {
    if (h.type === 'verb') verbs++;
    else if (h.type === 'case') cases++;
    else if (h.type === 'syntax') syntax++;
    else if (h.type === 'vocab' || h.type === 'lexicon') vocab++;
  }
  return {
    sentences: (session.sentences || []).length,
    highlights: hs.length,
    verbs,
    cases,
    syntax,
    vocab,
  };
}

export interface ArchiveTotals {
  sessions: number;
  /** Total highlight count across all sessions (the "Vocabulary growth" KPI). */
  totalHighlights: number;
  verbs: number;
  cases: number;
  syntax: number;
  totalSeconds: number;
}

/** Aggregate counts across all sessions, for the Archive KPI cards. */
export function archiveTotals(sessions: Session[]): ArchiveTotals {
  let totalHighlights = 0;
  let verbs = 0;
  let cases = 0;
  let syntax = 0;
  let totalSeconds = 0;
  for (const s of sessions) {
    totalSeconds += s.durationSeconds || 0;
    for (const h of sessionHighlights(s)) {
      totalHighlights++;
      if (h.type === 'verb') verbs++;
      else if (h.type === 'case') cases++;
      else if (h.type === 'syntax') syntax++;
    }
  }
  return { sessions: sessions.length, totalHighlights, verbs, cases, syntax, totalSeconds };
}
