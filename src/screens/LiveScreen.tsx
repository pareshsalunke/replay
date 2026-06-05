import type { MicStatus } from '@/types';
import { useRecordingStore } from '@/store/recordingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUiStore } from '@/store/uiStore';
import { useRecordingControls } from '@/context/RecordingControls';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { Icon } from '@/components/ui/Icon';
import { LiveFeed } from '@/components/live/LiveFeed';
import { LiveSidebar } from '@/components/live/LiveSidebar';
import { LiveTimer } from '@/components/live/LiveTimer';
import shared from './screens.module.css';
import styles from './LiveScreen.module.css';

const MIC_STATUS_TEXT: Record<MicStatus, string> = {
  idle: 'Awaiting audio',
  connecting: 'Connecting…',
  connected: 'Connected · German',
  error: 'Connection error',
  disconnected: 'Disconnected',
};

/** Live session — real-time transcription and grammar analysis. */
export function LiveScreen() {
  const localOnly = useSettingsStore((s) => s.localStorageOnly);
  const openTranscriptionConfig = useUiStore((s) => s.openTranscriptionConfig);
  const isRecording = useRecordingStore((s) => s.isRecording);
  const { beginRecording, endSession } = useRecordingControls();

  return (
    <>
      <div className={shared.pageHead}>
        <h1>Live session</h1>
        <p>
          Real-time linguistic extraction. All audio is processed locally; transcripts sync only
          on confirmation.
        </p>
        <div className={shared.pageActions}>
          {isRecording ? (
            <Button variant="danger" onClick={endSession}>
              Stop recording
            </Button>
          ) : (
            <Button variant="primary" icon="mic" onClick={beginRecording}>
              Start recording
            </Button>
          )}
          <Button onClick={openTranscriptionConfig}>Configure capture</Button>
          {localOnly && (
            <Pill style={{ marginLeft: 'auto' }}>
              <Icon name="lock" size={11} strokeWidth={1.8} />
              Local-only
            </Pill>
          )}
          <Pill
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              marginLeft: localOnly ? undefined : 'auto',
            }}
          >
            <LiveTimer />
          </Pill>
        </div>
      </div>

      <div className={shared.liveGrid}>
        <div className={shared.transcript}>
          <div className={shared.cardHead}>
            <h3>Transcript · Live</h3>
            <MicStatusLabel />
          </div>
          <LiveFeed />
        </div>
        <LiveSidebar />
      </div>
    </>
  );
}

function MicStatusLabel() {
  const status = useRecordingStore((s) => s.micStatus);
  return (
    <span className={styles.micStatus}>
      <Icon name="mic" size={13} />
      {MIC_STATUS_TEXT[status]}
    </span>
  );
}
