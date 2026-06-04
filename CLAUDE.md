# Replay — agent context

Replay is a German-language practice tool: it transcribes live meetings (Deepgram WebSocket) and annotates each sentence with CEFR + clickable grammar highlights (Gemini 2.5 Flash). Each highlight opens a deep-dive drawer with a streamed explanation and a practice-grading bot.

It began as a single-file vanilla-JS prototype at `../stitch_sprachjournal_german_tutor/index.html` (kept around as a visual reference) and was rewritten as this React + TypeScript app. The architectural plan and roadmap live at `./PLAN.md`.

## Shape

- **100% client-side.** Vite + React 18 + TypeScript. No backend, no server-side code.
- **Deepgram (WebSocket)** and **Gemini 2.5 Flash (REST)** are called directly from the browser.
- **API keys are build-time `VITE_*` env vars** inlined into the bundle (`VITE_DEEPGRAM_KEY`, `VITE_GEMINI_KEY`). The Settings modal does **not** collect keys — do not add that back.
- Deployed to **Vercel**. Locally, double-click `Replay.command` (or `npm run dev`).
- Persistence: `localStorage`, all keys prefixed `replay_*`. A one-time migration copies any old `sprachjournal_*` values across.

## Directory map

```
src/
  lib/         pure functions, no I/O, no React — cefr, format, highlights,
               export, stats, insights, lexicon
  services/    side-effects, no React — deepgram, gemini, audioCapture, analysis,
               apiKeys, prompts, storage, analytics
  store/       Zustand stores — settings, sessions, recording (hot), grammar, ui
  hooks/       useRecordingSession, useWaveform, useEscapeKey
  context/     RecordingControlsProvider — wraps useRecordingSession once for the app
  components/  layout (AppShell, TopBar, Sidebar, RecordingBanner)
               ui (Button, Pill, Toggle, Segmented, Modal, Drawer, Card, SideCard,
                   BarRow, Spinner, Icon)
               grammar (HighlightedText, GrammarHighlight)
               insights (CefrTrendChart), lexicon (Flashcard)
               live, studio
  screens/     ArchiveScreen, LiveScreen, StudioScreen, InsightsScreen, LexiconScreen
  modals/      SettingsModal, TranscriptionConfigModal, SessionSummaryModal,
               GrammarDrawer
  styles/      tokens.css + global.css + keyframes.css (global) — all else *.module.css
  types/       single types/index.ts
```

## Conventions to keep

- **No `dangerouslySetInnerHTML`.** Grammar highlights render via React nodes: `computeHighlightSpans` → `<HighlightedText>` / `<GrammarHighlight>`. The single-pass overlap-removal in `lib/highlights.ts` is intentional — it fixes the prototype's sequential-replace bug. Don't replace it with a regex.
- **Narrow Zustand selectors are mandatory** for `useRecordingStore`. The timer ticks every 1s, interim transcript updates many times/sec, and a broad subscription would re-render the whole app. Every call site passes a selector. Waveform bar heights never go through any store — `useWaveform` mutates DOM in the rAF callback directly.
- **Refs hold imperative objects** (`AudioContext`, `AnalyserNode`, `MediaStream`, `MediaRecorder`, `WebSocket`, interval ids, rAF ids). Never `useState` for these.
- **Teardown is centralized in `useRecordingSession`.** Its unmount `useEffect` runs full teardown — this is the leak fix vs. the prototype (which never cleaned up if you navigated away mid-recording).
- **Audio capture is a singleton** (`services/audioCapture.ts`). Only one recording runs at a time across the whole app.
- **CSS Modules per component**, referencing global tokens via `var(--token)`. Dynamic value-driven styles (bar widths, CEFR-colored borders, waveform heights) stay as React `style={{}}`.
- **Pure vs. impure split**: `lib/` is deterministic and testable, `services/` does I/O. Don't mix them.

## Faithful-port guardrails (don't "fix" these)

These are ported from the prototype on purpose — leave them alone unless a roadmap item explicitly removes them:

- The **Local-only storage** toggle is inert (no cloud either way).
- The **Auto-detect meetings** toggle is inert (labeled "Coming in V2").
- The **Archive tabs** (All / Recent / Flagged / Drafts) and the **top-bar search** are inert.
- The three **Transcription configuration** toggles are cosmetic, not persisted.
- The **Grammar lab** sidebar item shows a "coming soon" alert. (**Insights** and **Lexicon** are now real routes — shipped in V1.5.)

## Data model (`types/index.ts`)

- `Session { id, title, date, overallCefr, durationSeconds, sentences, context? }`
- `Sentence { text, translation, cefr, highlights }`
- `Highlight { text, type, reason, correction, alternatives }`
- `SessionContext = 'class' | 'teacher' | 'work' | 'testing'` — picked in the post-session modal; used by analytics to separate real captures from desk-testing.
- `Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'`
- `GrammarType = 'verb' | 'case' | 'syntax' | 'vocab' | 'lexicon'` — `lexicon` is a legacy alias for `vocab` and renders with the vocab color.
- `ConstructType = 'verb' | 'case' | 'syntax' | 'vocab'` — the 4 display buckets (lexicon folded into vocab). `LexiconEntry` is the deduplicated vocab model.

## Insights & Lexicon (V1.5)

- **`lib/insights.ts`** owns cross-session aggregation (`constructFrequency`, `correctionCounts`, `topWeakness`, `cefrTrend`, `insightsSummary`) plus `ConstructType`/`constructBucket`/`CONSTRUCT_TYPES` and the shared `grammarTypeColor()` helper (returns `var(--gr-*)` tokens). Use this helper for type colors — don't re-hardcode the hex map.
- **`lib/lexicon.ts`** owns `buildLexiconEntries` (dedupe key = `normalizedText|displayType`; representative fields prefer an occurrence that has a correction) and `filterLexicon`. Sort: count desc → lastSeenDate desc → alphabetical.
- **Lexicon reuses the Grammar drawer** for deep-dive + practice grading — it calls `grammarStore.open(target)` mapping a `LexiconEntry → GrammarTarget`. Don't reimplement chat/grading.
- Both screens read `sessions` via a narrow selector and wrap aggregation in `useMemo([sessions])`. View/filter/flashcard state is local `useState` (no new store). The CEFR trend is a dependency-free inline-SVG polyline (`components/insights/CefrTrendChart`).

## Analytics (`services/analytics.ts`)

Local-first event log in `localStorage` (bounded to 2000 entries), stable per-browser tester id, optional Plausible forwarding on non-localhost. Events: `app_opened`, `capture_started`, `capture_completed`, `feedback_viewed`, `grammar_deep_dive`, `export`, `second_real_capture`. A capture is "real" when `context !== 'testing'` and duration ≥ 60s. `exportUsageLog()` downloads the local log as JSON for tester feedback. `window.replayStats()` prints a count table in DevTools.

Plausible is currently **disabled** (`USE_PLAUSIBLE = false`). Flip it once the snippet is wired into the deployed site.

## Build / run

```sh
npm install
npm run dev      # dev server at http://localhost:5173, HMR
npm run build    # type-check + production bundle
npm run preview  # serve dist/ at http://localhost:4173
```

For recording to work, `VITE_DEEPGRAM_KEY` and `VITE_GEMINI_KEY` must be set in `.env.local` (for local dev) or in Vercel's environment variables (for deploy). Without them, the UI loads but recording surfaces "Transcription is not configured on this deployment."

The double-click launcher is `Replay.command` at the project root.

## Plan file

Architectural decisions and the V1.5 / V2 roadmap: `./PLAN.md`.
