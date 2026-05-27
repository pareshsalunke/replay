import type { GrammarType } from '@/types';

/** Human-readable type labels used in the deep-dive explanation prompt. */
const EXPLANATION_TYPE_LABELS: Record<GrammarType, string> = {
  verb: 'verb form / conjugation',
  case: 'grammatical case',
  syntax: 'syntactic structure',
  vocab: 'vocabulary / lexicon',
  lexicon: 'vocabulary / lexicon',
};

/** Prompt for per-sentence structured analysis (used with ANALYSIS_SCHEMA). */
export function analysisPrompt(text: string, userLevel: string): string {
  return `You are a German language tutor analyzing speech for a ${userLevel} CEFR learner.

Analyze this German sentence and return structured JSON:
- "translation": accurate English translation
- "cefr": CEFR level (A1, A2, B1, B2, C1, or C2) of this sentence based on vocabulary and grammar complexity
- "highlights": array of notable words/phrases with their grammar type and annotation

For each highlight:
- "text": exact substring of the sentence
- "type": ONLY one of "verb", "case", "syntax", "vocab"
  · verb: conjugated verbs, modals, past participles, infinitives
  · case: nouns with dative/accusative/genitive markers, articles showing case
  · syntax: subordinating conjunctions, relative clauses, verb-second order, modal particles
  · vocab: advanced, academic, or domain-specific vocabulary
- "reason": brief grammar annotation under 8 words
- "correction": if this is an error or awkward usage, the corrected form; otherwise empty string
- "alternatives": array of 1–2 natural German rephrasings of the full phrase (empty array if no error)

Extract 2-5 highlights. Calibrate difficulty annotations to a ${userLevel} learner. The "text" must be an exact substring of the sentence.

Sentence: "${text}"`;
}

/** Prompt for the streamed grammar deep-dive explanation. */
export function explanationPrompt(word: string, type: GrammarType, sentence: string): string {
  const label = EXPLANATION_TYPE_LABELS[type] || type;
  return `You are an expert German language tutor. Explain the ${label} "${word}" found in this sentence: "${sentence}"

Write a clear, academic but conversational explanation (3-5 sentences). Cover:
1. What grammatical rule applies and why
2. The specific form or case used and why it appears here
3. A brief mnemonic or tip for remembering this rule

Use plain text only. Do not use markdown. Be concise and pedagogically precise.`;
}

/** Prompt for grading a user's practice sentence. */
export function gradingPrompt(userText: string, word: string, type: string): string {
  return `You are a German language tutor. Grade this student sentence for the "${type}" rule demonstrated by "${word}".

Student sentence: "${userText}"
Context word/phrase: "${word}"
Rule type: ${type}

Respond in this exact format:
CORRECT: true
FEEDBACK: [one or two sentences of specific feedback]

Or:
CORRECT: false
FEEDBACK: [one or two sentences explaining the mistake and the correct form]`;
}
