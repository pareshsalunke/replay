/**
 * Gemini 2.5 Flash transport layer.
 *
 * Pure transport — no React. Functions take the API key explicitly so they
 * are decoupled from the settings store and easy to unit-test with a mocked
 * `fetch`.
 */

const MODEL = 'gemini-2.5-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Gemini structured-output schema for per-sentence analysis. */
export const ANALYSIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    translation: { type: 'STRING' },
    cefr: { type: 'STRING' },
    highlights: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          text: { type: 'STRING' },
          type: { type: 'STRING' },
          reason: { type: 'STRING' },
          correction: { type: 'STRING' },
          alternatives: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['text', 'type', 'reason'],
      },
    },
  },
  required: ['translation', 'cefr', 'highlights'],
};

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
}

/**
 * Non-streaming Gemini call. Returns the response text — a JSON string when
 * `responseSchema` is provided, otherwise plain text.
 */
export async function callGemini(
  apiKey: string,
  prompt: string,
  responseSchema?: unknown,
): Promise<string> {
  if (!apiKey) throw new Error('No Gemini API key configured');

  const generationConfig: Record<string, unknown> = { temperature: 0.3 };
  if (responseSchema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = responseSchema;
  }

  const res = await fetch(`${BASE}/${MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as GeminiResponse;
    throw new Error(err?.error?.message || `Gemini API error ${res.status}`);
  }
  const data = (await res.json()) as GeminiResponse;
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Streaming Gemini call. Invokes `onChunk` for each text chunk as it arrives.
 * Auto-retries once on transient server errors (429, 500, 503).
 */
export async function callGeminiStream(
  apiKey: string,
  prompt: string,
  onChunk: (text: string) => void,
  attempt = 0,
): Promise<void> {
  if (!apiKey) throw new Error('No Gemini API key configured');

  const res = await fetch(`${BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });

  // Auto-retry once on transient server errors.
  if (!res.ok) {
    if (attempt === 0 && [429, 500, 503].includes(res.status)) {
      await new Promise((r) => setTimeout(r, 1500));
      return callGeminiStream(apiKey, prompt, onChunk, 1);
    }
    throw new Error(`Gemini stream error ${res.status}`);
  }

  if (!res.body) throw new Error('Gemini stream returned no body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw) as GeminiResponse;
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) onChunk(text);
        } catch {
          /* ignore a malformed SSE chunk */
        }
      }
    }
  }
}
