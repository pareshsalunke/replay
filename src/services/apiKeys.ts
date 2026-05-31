/**
 * Build-time API keys. Set VITE_DEEPGRAM_KEY and VITE_GEMINI_KEY in Vercel's
 * environment variables — Vite inlines them into the client bundle at build.
 *
 * NOTE: these keys are visible to anyone who views the deployed JS. Restrict
 * them in each provider's dashboard (referrer for Gemini, monthly cap for
 * Deepgram) before shipping to anyone outside a trusted tester group.
 */

export function getDeepgramKey(): string {
  return import.meta.env.VITE_DEEPGRAM_KEY ?? '';
}

export function getGeminiKey(): string {
  return import.meta.env.VITE_GEMINI_KEY ?? '';
}
