import type { Cefr, ConstructType, GrammarType, Session } from '@/types';
import { sessionHighlights } from './stats';
import { CEFR_ORDER, modeCefr } from './cefr';

/** The four display buckets, in canonical order. */
export const CONSTRUCT_TYPES: readonly ConstructType[] = ['verb', 'case', 'syntax', 'vocab'];

/** Map any GrammarType to its display bucket ('lexicon' folds into 'vocab'). */
export function constructBucket(type: GrammarType): ConstructType {
  return type === 'lexicon' ? 'vocab' : type;
}

/** Counts per display bucket. */
export type ConstructCounts = Record<ConstructType, number>;

function emptyCounts(): ConstructCounts {
  return { verb: 0, case: 0, syntax: 0, vocab: 0 };
}

/** CSS color (a `var()` token reference) per grammar/construct type. */
export const GRAMMAR_TYPE_COLOR: Record<ConstructType, string> = {
  verb: 'var(--gr-verb)',
  case: 'var(--gr-case)',
  syntax: 'var(--gr-syntax)',
  vocab: 'var(--gr-vocab)',
};

/** Color token for any grammar type (lexicon folds into vocab). */
export function grammarTypeColor(type: GrammarType): string {
  return GRAMMAR_TYPE_COLOR[constructBucket(type)];
}

/** The N most recent sessions by date (descending). N=0 → all sessions. */
function recentSessions(sessions: Session[], lastN: number): Session[] {
  if (!lastN || lastN <= 0) return sessions;
  return [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, lastN);
}

/** Aggregate every highlight across all sessions into the 4 display buckets. */
export function constructFrequency(sessions: Session[]): ConstructCounts {
  const counts = emptyCounts();
  for (const s of sessions) {
    for (const h of sessionHighlights(s)) {
      counts[constructBucket(h.type)]++;
    }
  }
  return counts;
}

/**
 * "Needs work": only highlights with a non-empty `correction` (actual
 * mistakes), counted per display bucket. `lastN` (default 0 = all) restricts
 * to the most recent N sessions by date.
 */
export function correctionCounts(sessions: Session[], lastN = 0): ConstructCounts {
  const counts = emptyCounts();
  for (const s of recentSessions(sessions, lastN)) {
    for (const h of sessionHighlights(s)) {
      if (h.correction && h.correction.trim() !== '') {
        counts[constructBucket(h.type)]++;
      }
    }
  }
  return counts;
}

/** The single bucket with the most corrections, or null when there are none. */
export function topWeakness(
  sessions: Session[],
  lastN = 0,
): { type: ConstructType; count: number } | null {
  const counts = correctionCounts(sessions, lastN);
  let best: { type: ConstructType; count: number } | null = null;
  for (const type of CONSTRUCT_TYPES) {
    const count = counts[type];
    if (count > 0 && (!best || count > best.count)) best = { type, count };
  }
  return best;
}

/** One point on the CEFR trend line. */
export interface CefrTrendPoint {
  sessionId: string;
  title: string;
  /** ISO datetime, from session.date. */
  date: string;
  cefr: Cefr;
  /** 0..5 position in CEFR_ORDER, for plotting. */
  index: number;
}

/** The CEFR level for a session: stored overall, else mean of sentences, else B1. */
function sessionCefr(session: Session): Cefr {
  if (session.overallCefr) return session.overallCefr;
  const fromSentences = modeCefr((session.sentences || []).map((s) => s.cefr));
  return fromSentences ?? 'B1';
}

/** Per-session CEFR over time, sorted ascending by date (oldest → newest). */
export function cefrTrend(sessions: Session[]): CefrTrendPoint[] {
  return [...sessions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => {
      const cefr = sessionCefr(s);
      return {
        sessionId: s.id,
        title: s.title,
        date: s.date,
        cefr,
        index: Math.max(0, CEFR_ORDER.indexOf(cefr)),
      };
    });
}

/** Top-line numbers for the summary KPI strip. */
export interface InsightsSummary {
  totalSessions: number;
  totalConstructs: number;
  totalCorrections: number;
  startingCefr: Cefr | null;
  currentCefr: Cefr | null;
  totalSeconds: number;
}

export function insightsSummary(sessions: Session[]): InsightsSummary {
  let totalConstructs = 0;
  let totalCorrections = 0;
  let totalSeconds = 0;
  for (const s of sessions) {
    totalSeconds += s.durationSeconds || 0;
    for (const h of sessionHighlights(s)) {
      totalConstructs++;
      if (h.correction && h.correction.trim() !== '') totalCorrections++;
    }
  }
  const trend = cefrTrend(sessions);
  return {
    totalSessions: sessions.length,
    totalConstructs,
    totalCorrections,
    startingCefr: trend.length ? trend[0].cefr : null,
    currentCefr: trend.length ? trend[trend.length - 1].cefr : null,
    totalSeconds,
  };
}
