import type { Cefr, ConstructType, LexiconEntry, Session } from '@/types';
import { constructBucket } from './insights';

/**
 * Build the deduplicated, sorted lexicon across all sessions.
 *
 * Dedupe key = `normalizedText|displayType` (text trimmed + lowercased for the
 * key only; original casing kept for display). The same word under different
 * grammar types stays separate; 'lexicon' folds into 'vocab'. Representative
 * fields prefer the first occurrence that carried a correction (so the drawer
 * shows the corrected form when one exists), else the first occurrence.
 *
 * Sort: count desc → lastSeenDate desc → alphabetical (locale-aware).
 */
export function buildLexiconEntries(sessions: Session[]): LexiconEntry[] {
  const map = new Map<string, LexiconEntry>();

  for (const session of sessions) {
    for (const sentence of session.sentences || []) {
      for (const h of sentence.highlights || []) {
        const type: ConstructType = constructBucket(h.type);
        const key = `${h.text.trim().toLowerCase()}|${type}`;
        const hasCorrection = Boolean(h.correction && h.correction.trim() !== '');

        const existing = map.get(key);
        if (!existing) {
          map.set(key, {
            id: key,
            text: h.text,
            type,
            reason: h.reason,
            correction: h.correction,
            alternatives: h.alternatives,
            exampleSentence: sentence.text,
            exampleTranslation: sentence.translation,
            cefr: sentence.cefr,
            sessionId: session.id,
            sessionTitle: session.title,
            sessionDate: session.date,
            count: 1,
            lastSeenDate: session.date,
            hasError: hasCorrection,
          });
          continue;
        }

        existing.count++;
        existing.hasError = existing.hasError || hasCorrection;
        if (new Date(session.date).getTime() > new Date(existing.lastSeenDate).getTime()) {
          existing.lastSeenDate = session.date;
        }
        // Upgrade representative fields to the first occurrence that has a
        // correction, so the drawer surfaces the fix.
        if (hasCorrection && !(existing.correction && existing.correction.trim() !== '')) {
          existing.reason = h.reason;
          existing.correction = h.correction;
          existing.alternatives = h.alternatives;
          existing.exampleSentence = sentence.text;
          existing.exampleTranslation = sentence.translation;
          existing.cefr = sentence.cefr;
          existing.sessionId = session.id;
          existing.sessionTitle = session.title;
          existing.sessionDate = session.date;
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const dt = new Date(b.lastSeenDate).getTime() - new Date(a.lastSeenDate).getTime();
    if (dt !== 0) return dt;
    return a.text.localeCompare(b.text, 'de');
  });
}

/** Active filters for the Lexicon screen. */
export interface LexiconFilters {
  type: ConstructType | 'all';
  cefr: Cefr | 'all';
  sessionId: string | 'all';
}

export const EMPTY_LEXICON_FILTERS: LexiconFilters = {
  type: 'all',
  cefr: 'all',
  sessionId: 'all',
};

/** Whether any filter is set away from its default. */
export function hasActiveFilters(f: LexiconFilters): boolean {
  return f.type !== 'all' || f.cefr !== 'all' || f.sessionId !== 'all';
}

/** Apply filters. `sessionId` matches the entry's representative session. */
export function filterLexicon(entries: LexiconEntry[], f: LexiconFilters): LexiconEntry[] {
  return entries.filter((e) => {
    if (f.type !== 'all' && e.type !== f.type) return false;
    if (f.cefr !== 'all' && e.cefr !== f.cefr) return false;
    if (f.sessionId !== 'all' && e.sessionId !== f.sessionId) return false;
    return true;
  });
}
