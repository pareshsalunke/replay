import { create } from 'zustand';
import type { Cefr, GrammarType, Highlight, LiveParagraph, LiveSentence, MicStatus, Session } from '@/types';
import { modeCefr } from '@/lib/cefr';

/** Sentences per live paragraph block before a new paragraph starts. */
export const LIVE_PARA_SIZE = 3;

/** Analysis result applied to a single live sentence. */
export interface SentenceAnalysis {
  translation: string;
  cefr: Cefr | '';
  highlights: Highlight[];
}

interface RecordingState {
  /** Whether a session is actively recording. */
  isRecording: boolean;
  /** Elapsed recording time in seconds (ticks once per second). */
  elapsedSeconds: number;
  /** The current interim (non-final) transcript fragment. */
  interimText: string;
  /** Finalized sentences grouped into paragraphs of up to LIVE_PARA_SIZE. */
  paragraphs: LiveParagraph[];
  /** Microphone / Deepgram connection status. */
  micStatus: MicStatus;
  /** A user-facing error (mic denied, socket failure), or null. */
  liveError: string | null;
  /** Metadata shell for the session being recorded (sentences assembled on stop). */
  draftSession: Session | null;

  /** Begin a recording session. */
  start: (draft: Session) => void;
  /** End recording (keeps paragraphs/draft for assembly). */
  stop: () => void;
  /** Advance the elapsed-seconds timer by one. */
  tick: () => void;
  /** Update the interim transcript fragment. */
  setInterim: (text: string) => void;
  /** Update the connection status. */
  setMicStatus: (status: MicStatus) => void;
  /** Set (or clear) the live error message. */
  setError: (message: string | null) => void;
  /**
   * Append a finalized sentence into the current (or a new) paragraph.
   * Returns the new sentence's id so the caller can trigger analysis.
   */
  appendFinalSentence: (text: string) => string;
  /** Attach Gemini analysis to a sentence and recompute its paragraph. */
  attachAnalysis: (sentenceId: string, analysis: SentenceAnalysis) => void;
  /** Reset everything to the idle state. */
  reset: () => void;
  /** Flatten all paragraph sentences into a plain Session.sentences array. */
  collectSentences: () => LiveSentence[];
}

const IDLE = {
  isRecording: false,
  elapsedSeconds: 0,
  interimText: '',
  paragraphs: [] as LiveParagraph[],
  micStatus: 'idle' as MicStatus,
  liveError: null as string | null,
  draftSession: null as Session | null,
};

export const useRecordingStore = create<RecordingState>((set, get) => ({
  ...IDLE,

  start: (draft) =>
    set({
      isRecording: true,
      elapsedSeconds: 0,
      interimText: '',
      paragraphs: [],
      micStatus: 'connecting',
      liveError: null,
      draftSession: draft,
    }),

  stop: () => set({ isRecording: false, interimText: '' }),

  tick: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),

  setInterim: (text) => set({ interimText: text }),

  setMicStatus: (status) => set({ micStatus: status }),

  setError: (message) => set({ liveError: message }),

  appendFinalSentence: (text) => {
    const id = crypto.randomUUID();
    const sentence: LiveSentence = { id, text, translation: '', cefr: '', highlights: [] };
    set((s) => {
      const paras = s.paragraphs;
      const last = paras[paras.length - 1];
      if (last && last.sentences.length < LIVE_PARA_SIZE) {
        const updated: LiveParagraph = { ...last, sentences: [...last.sentences, sentence] };
        return { paragraphs: [...paras.slice(0, -1), updated], interimText: '' };
      }
      const para: LiveParagraph = {
        id: crypto.randomUUID(),
        startSeconds: s.elapsedSeconds,
        sentences: [sentence],
        cefr: '',
        tagTypes: [],
      };
      return { paragraphs: [...paras, para], interimText: '' };
    });
    return id;
  },

  attachAnalysis: (sentenceId, analysis) => {
    set((s) => ({
      paragraphs: s.paragraphs.map((p) => {
        if (!p.sentences.some((sent) => sent.id === sentenceId)) return p;
        const sentences = p.sentences.map((sent) =>
          sent.id === sentenceId
            ? {
                ...sent,
                translation: analysis.translation,
                cefr: analysis.cefr,
                highlights: analysis.highlights,
              }
            : sent,
        );
        const cefr: Cefr | '' = modeCefr(sentences.map((x) => x.cefr).filter(Boolean)) ?? '';
        const tagTypes: GrammarType[] = [
          ...new Set(sentences.flatMap((x) => x.highlights.map((h) => h.type))),
        ];
        return { ...p, sentences, cefr, tagTypes };
      }),
    }));
  },

  reset: () => set({ ...IDLE }),

  collectSentences: () => get().paragraphs.flatMap((p) => p.sentences),
}));
