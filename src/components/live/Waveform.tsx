import { useMemo, useRef } from 'react';
import { useRecordingStore } from '@/store/recordingStore';
import { useWaveform } from '@/hooks/useWaveform';
import styles from './Waveform.module.css';

/** Number of bars in the input-level meter. */
export const WAVEFORM_BAR_COUNT = 28;

/**
 * Input-level meter. Shows a static idle pattern when not recording; while
 * recording, the waveform hook animates the bars directly from live audio.
 */
export function Waveform() {
  const isRecording = useRecordingStore((s) => s.isRecording);
  const barsRef = useRef<(HTMLElement | null)[]>([]);
  const idleHeights = useMemo(
    () => Array.from({ length: WAVEFORM_BAR_COUNT }, () => 8 + Math.random() * 24),
    [],
  );

  useWaveform(barsRef, isRecording);

  return (
    <div className={styles.meter}>
      {idleHeights.map((h, i) => (
        <i
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}
