import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Cefr, Sentence, Session } from '@/types';
import { useSessionsStore } from '@/store/sessionsStore';
import { useRecordingStore } from '@/store/recordingStore';
import { useUiStore } from '@/store/uiStore';
import { modeCefr } from '@/lib/cefr';
import { startAudioCapture, stopAudioCapture } from '@/services/audioCapture';
import { createDeepgramConnection, type DeepgramConnection } from '@/services/deepgram';
import { runSentenceAnalysis } from '@/services/analysis';
import { trackCaptureCompleted, trackCaptureStarted } from '@/services/analytics';
import { getDeepgramKey } from '@/services/apiKeys';

/** Imperative recording controls exposed to the UI. */
export interface RecordingControls {
  beginRecording: () => void;
  endSession: () => void;
}

/** Route a Deepgram transcript into the store and trigger sentence analysis. */
function handleTranscript(text: string, isFinal: boolean): void {
  const rec = useRecordingStore.getState();
  if (!isFinal) {
    rec.setInterim(text);
    return;
  }
  const sentenceId = rec.appendFinalSentence(text);
  void runSentenceAnalysis(sentenceId, text);
}

/**
 * Orchestrates a full recording session: mic capture, Deepgram streaming,
 * the elapsed timer, per-sentence Gemini analysis, and teardown.
 *
 * Held by a single provider so the session survives navigation between
 * Archive and Live while recording.
 */
export function useRecordingSession(): RecordingControls {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<number | null>(null);
  const deepgramRef = useRef<DeepgramConnection | null>(null);

  /** Stop the timer, close the socket, tear down the mic graph. Idempotent. */
  const teardown = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (deepgramRef.current) {
      deepgramRef.current.close();
      deepgramRef.current = null;
    }
    stopAudioCapture();
  }, []);

  const beginRecording = useCallback(() => {
    const deepgramKey = getDeepgramKey();
    if (!deepgramKey) {
      // Build was deployed without VITE_DEEPGRAM_KEY — nothing we can do client-side.
      useRecordingStore
        .getState()
        .setError('Transcription is not configured on this deployment.');
      return;
    }

    // Clear any prior/zombie session so we never stack a second mic or timer.
    teardown();
    useRecordingStore.getState().reset();

    const draft: Session = {
      id: Date.now().toString(),
      title: `Live Session — ${new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}`,
      date: new Date().toISOString(),
      overallCefr: 'B1',
      durationSeconds: 0,
      sentences: [],
    };
    useRecordingStore.getState().start(draft);
    trackCaptureStarted();
    navigate('/live');

    // Elapsed-time timer.
    timerRef.current = window.setInterval(() => {
      useRecordingStore.getState().tick();
    }, 1000);

    // Microphone capture + Deepgram streaming.
    startAudioCapture()
      .then((recorder) => {
        const conn = createDeepgramConnection({
          apiKey: deepgramKey,
          onStatus: (status) => useRecordingStore.getState().setMicStatus(status),
          onTranscript: ({ text, isFinal }) => handleTranscript(text, isFinal),
        });
        deepgramRef.current = conn;
        conn.connect(recorder);
      })
      .catch(() => {
        useRecordingStore.getState().setMicStatus('error');
        useRecordingStore
          .getState()
          .setError(
            'Microphone access was denied or is unavailable. Check your browser permissions.',
          );
      });
  }, [navigate, teardown]);

  /**
   * Finalize the active session: tear down the mic/socket/timer, persist it
   * (or discard if empty), and show the summary.
   * - `navigateHome`: route to Archive (true for an explicit Stop; false when
   *   the user already navigated elsewhere and we're just auto-stopping).
   * - `silent`: suppress the "no German detected" alert (used on auto-stop).
   */
  const finalizeSession = useCallback(
    (opts: { navigateHome: boolean; silent: boolean }) => {
      const rec = useRecordingStore.getState();

      // Nothing in progress.
      if (!rec.draftSession) {
        if (opts.navigateHome) navigate('/');
        return;
      }

      teardown();
      const elapsed = rec.elapsedSeconds;
      const liveSentences = rec.collectSentences();
      const draft = rec.draftSession;

      // No German speech detected — discard the session.
      if (liveSentences.length === 0) {
        rec.reset();
        if (!opts.silent) window.alert('No German speech was detected. Session not saved.');
        if (opts.navigateHome) navigate('/');
        return;
      }

      const sentences: Sentence[] = liveSentences.map((s) => ({
        text: s.text,
        translation: s.translation,
        cefr: s.cefr,
        highlights: s.highlights,
      }));
      const overallCefr: Cefr = modeCefr(sentences.map((s) => s.cefr).filter(Boolean)) ?? 'B1';

      const finalSession: Session = {
        ...draft,
        durationSeconds: elapsed,
        overallCefr,
        sentences,
      };

      useSessionsStore.getState().addOrUpdate(finalSession);
      trackCaptureCompleted(finalSession.context ?? 'testing', elapsed);
      rec.reset();
      useUiStore.getState().showSummary(finalSession);
      if (opts.navigateHome) navigate('/');
    },
    [navigate, teardown],
  );

  // Explicit Stop (live button / banner) — finalize and return to Archive.
  const endSession = useCallback(() => {
    finalizeSession({ navigateHome: true, silent: false });
  }, [finalizeSession]);

  // Auto-stop on leaving the Live screen: when the route changes away from
  // /live while a session is active, finalize it (releasing the mic) without
  // hijacking the navigation the user just made. Lives in the always-mounted
  // provider, so it's immune to the StrictMode mount/unmount double-fire that
  // a LiveScreen-unmount effect would suffer.
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = location.pathname;
    if (prev === '/live' && location.pathname !== '/live') {
      if (useRecordingStore.getState().isRecording) {
        finalizeSession({ navigateHome: false, silent: true });
      }
    }
  }, [location.pathname, finalizeSession]);

  // Final safety net: tear down on full teardown of the app.
  useEffect(() => () => teardown(), [teardown]);

  return { beginRecording, endSession };
}
