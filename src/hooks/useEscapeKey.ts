import { useEffect } from 'react';
import { useUiStore } from '@/store/uiStore';
import { useGrammarStore } from '@/store/grammarStore';

/**
 * Global Escape handler — closes the Settings modal, the Transcription
 * config modal, and the Grammar drawer. The Session Summary modal is left
 * open intentionally (dismissing it exports the session).
 */
export function useEscapeKey() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const ui = useUiStore.getState();
      ui.closeSettings();
      ui.closeTranscriptionConfig();
      useGrammarStore.getState().close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
