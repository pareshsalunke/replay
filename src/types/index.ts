/**
 * Core data model for Replay.
 *
 * Mirrors the prototype's session/sentence/highlight shapes, now typed.
 */

/** CEFR proficiency levels, ascending. */
export type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * Grammar highlight categories returned by Gemini analysis.
 * 'lexicon' is a legacy alias for 'vocab' — both render with the vocab color.
 */
export type GrammarType = 'verb' | 'case' | 'syntax' | 'vocab' | 'lexicon';

/**
 * The four display buckets for grammar constructs. Identical to GrammarType
 * minus the legacy 'lexicon' alias (which folds into 'vocab' for display).
 * Defined here so it's the single source of truth shared by lib/ and types.
 */
export type ConstructType = 'verb' | 'case' | 'syntax' | 'vocab';

/** File format for session export. */
export type ExportFormat = 'md' | 'txt';

/** A flagged word or phrase within a sentence. */
export interface Highlight {
  /** Exact substring of the parent sentence. */
  text: string;
  type: GrammarType;
  /** Short grammar annotation (under ~8 words). */
  reason: string;
  /** Corrected form, or '' when the usage is already correct. */
  correction: string;
  /** 1–2 natural rephrasings, or [] when there is no error. */
  alternatives: string[];
}

/** One transcribed and analyzed sentence in a saved session. */
export interface Sentence {
  text: string;
  /** English translation; '' until Gemini analysis completes. */
  translation: string;
  /** CEFR level of this sentence; '' until analyzed. */
  cefr: Cefr | '';
  highlights: Highlight[];
}

/** Where a capture happened — used to separate real meetings from desk tests. */
export type SessionContext = 'class' | 'teacher' | 'work' | 'testing';

/** A recorded practice session, persisted to localStorage. */
export interface Session {
  id: string;
  title: string;
  /** ISO 8601 datetime. */
  date: string;
  overallCefr: Cefr;
  durationSeconds: number;
  sentences: Sentence[];
  /** Where the capture took place — set by the user in the post-session modal. */
  context?: SessionContext;
}

/** Persisted user settings. */
export interface Settings {
  localStorageOnly: boolean;
  autoDetect: boolean;
  exportFormat: ExportFormat;
  userCefr: Cefr;
}

/** Parsed Gemini sentence-analysis response (matches ANALYSIS_SCHEMA). */
export interface AnalysisResult {
  translation: string;
  /** Gemini-returned level string; narrowed to Cefr on use. */
  cefr: string;
  highlights: Highlight[];
}

/* ───────────────────────── Live-recording types ───────────────────────── */

/** Microphone / Deepgram connection status during a live session. */
export type MicStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disconnected';

/** A finalized sentence during a live session (a Sentence with a stable id). */
export interface LiveSentence extends Sentence {
  id: string;
}

/** A group of up to LIVE_PARA_SIZE sentences rendered as one paragraph. */
export interface LiveParagraph {
  id: string;
  /** Session-elapsed seconds when the paragraph started. */
  startSeconds: number;
  sentences: LiveSentence[];
  /** Averaged CEFR across analyzed sentences; '' while pending. */
  cefr: Cefr | '';
  /** Union of highlight types present in the paragraph. */
  tagTypes: GrammarType[];
}

/** A message bubble in the grammar-drawer practice chat. */
export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  status: 'pending' | 'done';
  /** Set only on graded AI replies. */
  correct?: boolean;
}

/** Describes the highlight a user clicked, used to populate the grammar drawer. */
export interface GrammarTarget {
  word: string;
  type: GrammarType;
  sentence: string;
  reason: string;
  correction: string;
  alternatives: string[];
}

/* ───────────────────────── Lexicon types ───────────────────────── */

/**
 * A deduplicated vocabulary entry aggregated from all sessions' highlights.
 * Keyed by normalized text + display type; see lib/lexicon.ts.
 */
export interface LexiconEntry {
  /** Stable dedupe key: `${normalizedText}|${type}`. */
  id: string;
  /** First-seen original casing of the word/phrase. */
  text: string;
  /** Display/grammar bucket (lexicon folded into vocab). */
  type: ConstructType;
  /** Representative reason (prefers an occurrence that carried a correction). */
  reason: string;
  /** Representative correction ('' when never flagged as an error). */
  correction: string;
  /** Representative alternative phrasings. */
  alternatives: string[];
  /** The sentence this entry was drawn from (drawer context). */
  exampleSentence: string;
  /** Translation of that example sentence ('' if none). */
  exampleTranslation: string;
  /** CEFR of the source sentence ('' if unanalyzed). */
  cefr: Cefr | '';
  /** Source session of the representative occurrence. */
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  /** How many times this word|type appeared across all sessions. */
  count: number;
  /** Most recent session date this entry appeared in (ISO) — for sort/filter. */
  lastSeenDate: string;
  /** Whether ANY occurrence carried a correction (drives a "needs work" mark). */
  hasError: boolean;
}
