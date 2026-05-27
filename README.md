# Replay

Turn your real German conversations into language practice. Replay transcribes
live meetings, scores each sentence by CEFR level, and gives clickable grammar
deep-dives — all running locally in your browser.

## Run it

**Double-click `Replay.command`.**

It opens a Terminal window, installs dependencies on the first run, builds the
app, and opens `http://localhost:4173` in your browser. Keep that window open
while you use Replay; closing it stops the app.

> First launch is slower (dependency install + build). Later launches are quick.
> Use a Chromium-based browser (Chrome, Edge, Arc) — microphone capture relies
> on `MediaRecorder` with Opus, which is strongest there.

## Set up

Open **Settings** (top-right gear) and paste:

- a **Deepgram API key** — live German transcription
- a **Gemini API key** — grammar analysis, translation, and deep-dives

Keys are stored only in your browser's `localStorage`. No data leaves your
device except the audio sent to Deepgram and sentences sent to Google Gemini.

## Develop

```sh
npm install     # once
npm run dev      # dev server at http://localhost:5173
npm run build    # type-check + production build
npm run preview  # serve the production build at http://localhost:4173
```

## Tech

React 18 + TypeScript + Vite. State via Zustand, routing via React Router.
No backend — Deepgram (WebSocket) and Gemini (REST) are called directly from
the browser. See `src/` for the structure: `lib/` pure utilities, `services/`
external integrations, `store/` state, `hooks/` the audio pipeline,
`components/` UI, `screens/` and `modals/`.
