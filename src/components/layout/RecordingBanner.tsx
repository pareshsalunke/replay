import { useRecordingStore } from '@/store/recordingStore';
import { useRecordingControls } from '@/context/RecordingControls';
import { formatTimerHMS } from '@/lib/format';
import styles from './RecordingBanner.module.css';

/** Sticky "recording in progress" banner — Variation 04. */
export function RecordingBanner() {
  const isRecording = useRecordingStore((s) => s.isRecording);
  if (!isRecording) return null;
  return <RecordingBannerInner />;
}

/** Inner banner — isolated so the 1s timer tick only re-renders this. */
function RecordingBannerInner() {
  const elapsed = useRecordingStore((s) => s.elapsedSeconds);
  const { endSession } = useRecordingControls();

  return (
    <div className={styles.banner}>
      <div className={styles.inner} role="status">
        <span className={styles.square} aria-hidden="true" />
        <span className={styles.label}>Active session · linguistic analysis in progress</span>
        <div className={styles.meta}>
          <span>{formatTimerHMS(elapsed)}</span>
          <button className={styles.stop} type="button" onClick={endSession}>
            Stop recording
          </button>
        </div>
      </div>
    </div>
  );
}
