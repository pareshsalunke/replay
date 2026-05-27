import { createContext, useContext, type ReactNode } from 'react';
import { useRecordingSession, type RecordingControls } from '@/hooks/useRecordingSession';

const RecordingControlsContext = createContext<RecordingControls | null>(null);

/**
 * Provides recording controls (`beginRecording` / `endSession`) app-wide.
 * Mounted once, inside the router, so the session survives navigation
 * between Archive and Live while recording.
 */
export function RecordingControlsProvider({ children }: { children: ReactNode }) {
  const controls = useRecordingSession();
  return (
    <RecordingControlsContext.Provider value={controls}>
      {children}
    </RecordingControlsContext.Provider>
  );
}

/** Access the app-wide recording controls. */
export function useRecordingControls(): RecordingControls {
  const ctx = useContext(RecordingControlsContext);
  if (!ctx) {
    throw new Error('useRecordingControls must be used within RecordingControlsProvider');
  }
  return ctx;
}
