import { useRecordingStore } from '@/store/recordingStore';
import styles from './live.module.css';

/** Shows the current interim (non-final) transcript fragment while speaking. */
export function InterimBlock() {
  const interimText = useRecordingStore((s) => s.interimText);
  if (!interimText) return null;

  return (
    <div className={styles.interim}>
      <span className={styles.interimLabel}>listening…</span>
      <p className={styles.interimText}>{interimText}</p>
    </div>
  );
}
