import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cefr, Sentence, Session } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';
import { useSessionsStore } from '@/store/sessionsStore';
import { useRecordingStore } from '@/store/recordingStore';
import { useUiStore } from '@/store/uiStore';
import { modeCefr } from '@/lib/cefr';
import { startAudioCapture, stopAudioCapture } from '@/services/audioCapture';
import { createDeepgramConnection, type DeepgramConnection } from '@/services/deepgram';
import { runSentenceAnalysis } from '@/services/analysis';

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
    const { deepgramKey } = useSettingsStore.getState();
    if (!deepgramKey) {
      // No key — send the user to Settings instead of starting.
      useUiStore.getState().openSettings();
      return;
    }

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
  }, [navigate]);

  const endSession = useCallback(() => {
    const rec = useRecordingStore.getState();

    // Nothing in progress — just navigate home.
    if (!rec.draftSession) {
      navigate('/');
      return;
    }

    teardown();
    const elapsed = rec.elapsedSeconds;
    const liveSentences = rec.collectSentences();
    const draft = rec.draftSession;

    // Guard: no German speech detected — discard the session.
    if (liveSentences.length === 0) {
      rec.reset();
      window.alert('No German speech was detected. Session not saved.');
      navigate('/');
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
    rec.reset();
    useUiStore.getState().showSummary(finalSession);
    navigate('/');
  }, [navigate, teardown]);

  // Tear down on unmount — covers a hard stop / navigating away mid-recording.
  useEffect(() => () => teardown(), [teardown]);

  return { beginRecording, endSession };
}
