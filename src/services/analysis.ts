import type { AnalysisResult, Cefr, GrammarType, Highlight } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';
import { useRecordingStore } from '@/store/recordingStore';
import { callGemini, ANALYSIS_SCHEMA } from './gemini';
import { analysisPrompt } from './prompts';

const CEFR_VALUES = new Set<string>(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
const GRAMMAR_TYPES = new Set<string>(['verb', 'case', 'syntax', 'vocab', 'lexicon']);

/**
 * Analyze a finalized sentence with Gemini and attach the result to its
 * paragraph in the recording store. Fire-and-forget — failures are swallowed
 * so a bad analysis never interrupts the live session.
 */
export async function runSentenceAnalysis(sentenceId: string, text: string): Promise<void> {
  const { geminiKey, userCefr } = useSettingsStore.getState();
  if (!geminiKey) return;

  try {
    const raw = await callGemini(geminiKey, analysisPrompt(text, userCefr), ANALYSIS_SCHEMA);
    const result = JSON.parse(raw) as AnalysisResult;

    const cefrUpper = (result.cefr || '').toUpperCase();
    const cefr: Cefr = CEFR_VALUES.has(cefrUpper) ? (cefrUpper as Cefr) : 'B1';

    // Keep only highlights whose text is an exact substring of the sentence.
    const highlights: Highlight[] = (result.highlights || [])
      .filter(
        (h): h is Highlight =>
          Boolean(h.text) && GRAMMAR_TYPES.has(h.type) && text.includes(h.text),
      )
      .map((h) => ({
        text: h.text,
        type: h.type as GrammarType,
        reason: h.reason || '',
        correction: h.correction || '',
        alternatives: Array.isArray(h.alternatives) ? h.alternatives : [],
      }));

    useRecordingStore.getState().attachAnalysis(sentenceId, {
      translation: result.translation || '',
      cefr,
      highlights,
    });
  } catch {
    /* analysis failed — leave the sentence un-analyzed */
  }
}
