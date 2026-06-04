# Replay — Architecture & Roadmap

## What it is

Replay is a German language-learning tool that transcribes live meetings (Deepgram WebSocket) and annotates each sentence with CEFR level + clickable grammar highlights (Gemini 2.5 Flash). Each highlight opens a deep-dive drawer with a streamed explanation and a practice-grading chat.

It began as a single 2,454-line `index.html` vanilla-JS prototype at `../stitch_sprachjournal_german_tutor/` and was rewritten as this React + TypeScript app. The prototype stays as a visual reference; it is not used in the build.

---

## What has been built (V1 complete)

### Architecture decisions (locked in)

| Decision | Choice | Rationale |
|---|---|---|
| Language | TypeScript (strict) | Type-safe data model + API contracts; catches bugs at build time |
| Build | Vite + React 18 | Fast HMR, CSS Modules, `@` alias, `tsc -b` for type checking |
| Routing | React Router 6 | Real URLs (`/`, `/live`, `/studio/:id`), browser back/forward |
| State | Zustand 4 | Selector-based subscriptions isolate re-renders; non-React code uses `getState()` in WS handlers |
| Styling | CSS Modules + global tokens | Hand-rolled design system; user explicitly left Tailwind behind |
| Backend | None | 100% client-side; Deepgram + Gemini called directly from the browser |
| API keys | Build-time `VITE_*` env vars | Keys inlined at build; for local dev use `.env.local`; for Vercel use environment variables |
| Launcher | `Replay.command` | Double-clickable macOS script: install → build → `vite preview --open` |

### Feature inventory

**5 screens**
- **Archive** (`/`) — session ledger (localStorage), KPI cards (vocab growth bars, sessions logged, mastery target), inert tabs (All / Recent / Flagged / Drafts)
- **Live** (`/live`) — real-time transcript feed with interim + paragraph blocks (3 sentences each), waveform meter (28 bars, 60fps via rAF/DOM direct-mutation), capture metadata sidebar, per-session grammar counters
- **Transcript Studio** (`/studio/:id`) — paragraph-grouped transcript with clickable grammar highlights, calibration sidebar, Export button
- **Insights** (`/insights`) — cross-session analytics: summary KPI strip (sessions / constructs / corrections / CEFR start→current / speaking time), construct-frequency bars by type, "needs work" corrections + top-weakness card, and a dependency-free inline-SVG CEFR trend chart. Aggregations are pure (`lib/insights.ts`), memoized over `sessions`.
- **Lexicon** (`/lexicon`) — every flagged word/phrase across sessions, deduplicated by `text|type` with occurrence counts (`lib/lexicon.ts`). List view (color-coded rows, needs-work dots) + flashcard study mode (flip, ←/→ keyboard nav) + filters (type / CEFR / session). Each entry opens the existing Grammar drawer for deep-dive + practice grading.

**4 modals / drawers**
- **Settings** — CEFR level, export format, Local-only + Auto-detect toggles, usage log download; no API key fields (keys are build-time)
- **Grammar deep-dive drawer** — clicked word in type color, type/reason pills, correction + alternatives, streamed Gemini explanation (auto-retry on 5xx + "Try again" button), practice input → Gemini grading → chat bubbles
- **Transcription config** — 3 cosmetic toggles (inert, not persisted)
- **Session summary** — duration / sentences / CEFR grid, SessionContext picker (Class / Teacher / Work / Just testing), grammar-pattern pills, words-flagged count, Back to Archive + Export

**Recording pipeline**
- `services/audioCapture.ts` — singleton module; `getUserMedia` → `AudioContext` + `AnalyserNode` (fftSize 64) → `MediaRecorder` (audio/webm;codecs=opus)
- `services/deepgram.ts` — `createDeepgramConnection()`; WebSocket to `wss://api.deepgram.com/v1/listen?language=de&model=nova-3&...`; auth via `['token', key]` subprotocol; starts recorder at 250ms slices on open
- `services/analysis.ts` — `runSentenceAnalysis()`; fires Gemini per finalized sentence; attaches result to `recordingStore`; fire-and-forget
- `hooks/useRecordingSession.ts` — orchestrator; owned by `RecordingControlsProvider`; survives Archive↔Live navigation; teardown on unmount fixes a prototype leak
- `hooks/useWaveform.ts` — rAF loop writes `bar.style.height` directly; zero React renders for the 60fps path

**Persistence**
- All `localStorage`, prefix `replay_*`
- One-time migration copies `sprachjournal_*` values across on first launch (does not delete old keys)
- Sessions, settings, export format, CEFR level, tester id, analytics events

**Analytics** (`services/analytics.ts`)
- Local-first: bounded event log (2000 entries) in localStorage; stable per-browser tester id
- Events: `app_opened`, `capture_started`, `capture_completed` (with `context` + `seconds`), `feedback_viewed`, `grammar_deep_dive`, `export`, `second_real_capture`
- A capture is "real" when `context !== 'testing'` AND duration ≥ 60s
- `exportUsageLog()` downloads JSON for tester feedback
- `window.replayStats()` prints a count table in DevTools
- Optional Plausible forwarding (currently `USE_PLAUSIBLE = false`; flip once the snippet is wired into the deployed site)

**Grammar rendering** — `lib/highlights.ts` → `computeHighlightSpans()` returns typed `Segment[]`; `<HighlightedText>` maps to React nodes; `<GrammarHighlight>` is a keyboard-accessible clickable span — no `dangerouslySetInnerHTML`

### Stores

| Store | Purpose | Update frequency |
|---|---|---|
| `settingsStore` | CEFR, export format, toggles | Rare (Settings save) |
| `sessionsStore` | Saved sessions list + current (Studio) | Per session end |
| `recordingStore` | Live recording state | HOT — 1/s (timer), many/s (interim), ~60fps (waveform never touches it) |
| `grammarStore` | Drawer open/target/chat | Per click |
| `uiStore` | Modal visibility (settings, transcription config, summary) | Per open/close |

### Current directory structure (actual)

```
src/
  styles/         tokens.css, global.css, keyframes.css  (global)
  types/          index.ts
  lib/            cefr, format, highlights, export, stats,
                  insights, lexicon  (pure, no I/O)
  services/       deepgram, gemini, audioCapture, analysis, apiKeys,
                  prompts, storage, analytics
  store/          settingsStore, sessionsStore, recordingStore, grammarStore, uiStore
  hooks/          useRecordingSession, useWaveform, useEscapeKey
  context/        RecordingControlsProvider
  components/
    layout/       AppShell, TopBar, Sidebar, RecordingBanner
    ui/           Button, Pill, Toggle, Segmented, Modal, Drawer,
                  Card, SideCard, BarRow, Spinner, Icon
    grammar/      HighlightedText, GrammarHighlight
    live/         LiveFeed, InterimBlock, LiveParagraphBlock, LiveSidebar,
                  LiveTimer, Waveform
    studio/       TranscriptParagraph
    insights/     CefrTrendChart
    lexicon/      Flashcard
  screens/        ArchiveScreen, LiveScreen, StudioScreen,
                  InsightsScreen, LexiconScreen
  modals/         SettingsModal, GrammarDrawer, TranscriptionConfigModal,
                  SessionSummaryModal
```

---

## Roadmap

### Shipped in V1.5

- ✅ **Insights screen** (`/insights`) — construct frequency, corrections + top weakness, CEFR trend chart, summary KPIs.
- ✅ **Lexicon screen** (`/lexicon`) — list + flashcards + filters, deep-dive/practice via the reused Grammar drawer.

### Now — remaining V1.5 (same browser architecture)

| Feature | What it is | Notes |
|---|---|---|
| **IndexedDB migration** | Replace localStorage for session data when storage approaches 5–10MB limit | Same `sessions` schema; drop-in replacement for `storage.ts` session methods |
| **Tests** | Vitest + React Testing Library + jsdom; reuses `vite.config.ts` | Start with `lib/` pure utils (highest ROI), then services with mocked fetch/WebSocket, then stores, then hooks with fake timers |

**Testing targets now also include** `lib/insights.ts` (construct/correction counts, topWeakness ties, cefrTrend date-sort) and `lib/lexicon.ts` (dedupe by `text|type`, count, correction-preferring representative, sort order, filters).

### Next build — Core Vocabulary mode for Lexicon ("Top 2000")

A curated, frequency-ranked list of the ~2000 highest-impact German words (≈80% of everyday conversation), each with **5 example sentences graded A1 → B2**. Sits alongside today's Lexicon (built from *your own* flagged words) as a second mode — e.g. a "Core 2000" vs. "My words" switch — so you can study toward conversational coverage, not just review what you happened to say.

Open questions to resolve when building:
- **Word-list source:** bundle a vetted frequency list (static JSON) vs. generate/curate it.
- **Example sentences:** pre-generate all 5×2000 at build time (committed JSON — deterministic, offline, no per-user API cost) vs. on-demand via Gemini with caching. Leaning pre-generated.
- **Integration:** a mode toggle in the Lexicon screen; extend `<Flashcard>` to page through the 5 graded sentences; per-word progress/mastery tracking; interaction with filters.
- **Storage:** corpus is read-only static data; only per-word progress is persisted.

**Testing targets (priority order):**
1. `lib/highlights.ts` — `computeHighlightSpans` overlap/dedup logic (the bug the single-pass design fixes)
2. `lib/cefr.ts`, `lib/format.ts`, `lib/export.ts` (golden snapshot), `lib/stats.ts`
3. `services/storage.ts` — round-trip + `sprachjournal_→replay_` migration
4. `services/gemini.ts` — retry-once on 5xx, SSE chunk parsing (mocked `fetch`)
5. `services/deepgram.ts` — open/message/close lifecycle (mocked `WebSocket`)
6. `store/recordingStore` — paragraph grouping at 3, `attachAnalysis`, `reset`
7. `hooks/useRecordingSession` — teardown on unmount (mock audio + socket modules)

---

### Later — V2 (requires leaving the browser)

These require a native wrapper (Electron or similar) because the browser sandbox blocks them.

| Feature | Why browser-blocked | Approach |
|---|---|---|
| **System audio capture** | `getUserMedia` can only capture the mic; capturing a Zoom/Meet call requires OS-level audio routing | Electron `desktopCapturer` + virtual audio driver (BlackHole on macOS) |
| **Auto meeting detection** | Requires polling OS process list | Electron main-process script; `child_process.exec('ps aux')` on macOS |
| **Speaker diarization** | Only relevant once system audio is captured (multiple speakers) | Deepgram `diarize=true` param; render user's speaker track separately |
| **SQLite persistence** | Removes browser storage limits (currently ~5–10MB) | `better-sqlite3` in Electron main process; same session schema |
| **Adaptive learning path** | Needs CEFR grammar topic tree + mastered/skipped states + meaningful session history | New screen; requires 5+ real sessions to be useful |
| **.dmg / .exe packaging** | Distribution as a real app | Electron Builder + auto-updater |

The React + Vite + service-layer architecture ports cleanly into an Electron renderer — the `services/` layer is already decoupled from the browser environment enough that swapping `localStorage` for SQLite IPC and `getUserMedia` for `desktopCapturer` are targeted changes, not rewrites.

---

## Inert bits (intentionally left as-is)

These are ported faithfully from the prototype. Do not "fix" them without a roadmap decision:

- **Local-only storage** toggle — no cloud sync exists either way; the toggle is persisted but has no effect
- **Auto-detect meetings** — labeled "Coming in V2"; toggle is persisted but has no effect
- **Archive tabs** (All / Recent / Flagged / Drafts) — `aria-selected` toggles, no filtering
- **Top-bar search** — renders but does nothing
- **Transcription configuration** toggles — cosmetic, not persisted, no effect on Deepgram params
- **Lexicon** and **Grammar lab** sidebar items — show "coming soon" alert

---

## Gemini prompts (locked — change only with care)

Three prompt templates in `services/prompts.ts`:

1. **Sentence analysis** — structured JSON (translation, cefr, highlights[]); uses `ANALYSIS_SCHEMA` for structured output; calibrated to `userCefr`; 2–5 highlights per sentence; `text` must be an exact substring of the sentence
2. **Grammar explanation** — streamed; 3–5 plain-text sentences; covers rule, specific form, mnemonic
3. **Practice grading** — `CORRECT: true/false` + `FEEDBACK:` format; parsed by splitting on those prefixes

The sentence analysis schema (`ANALYSIS_SCHEMA` in `services/gemini.ts`) requires `['translation', 'cefr', 'highlights']` and each highlight requires `['text', 'type', 'reason']`.

---

## Key invariants (never break these)

1. **`computeHighlightSpans` is a single forward pass** — it was designed to fix the prototype's sequential-replace bug where a later highlight would match inside an earlier highlight's `data-sentence` attribute. Do not replace with `String.replace()` loops.
2. **Every `useRecordingStore(...)` call passes a selector.** Never subscribe to the whole store — the timer, interim text, and waveform each update at different rates.
3. **Waveform bypasses React entirely** — bar heights are written to `bar.style.height` in the rAF callback; they never touch any store or `useState`.
4. **`teardown()` in `useRecordingSession` is the single authoritative cleanup** — it stops the recorder, closes the socket, stops tracks, closes the AudioContext, and clears the timer. Nothing else should try to clean up recording resources.
5. **No `dangerouslySetInnerHTML`** — all grammar highlights render as React nodes via `<HighlightedText>` / `<GrammarHighlight>`.
