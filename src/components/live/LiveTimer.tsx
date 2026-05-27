import type { CSSProperties } from 'react';
import { useRecordingStore } from '@/store/recordingStore';
import { formatTimerHMS } from '@/lib/format';

interface LiveTimerProps {
  className?: string;
  style?: CSSProperties;
}

/** Elapsed-time display. Isolated so the 1s tick only re-renders this. */
export function LiveTimer({ className, style }: LiveTimerProps) {
  const elapsed = useRecordingStore((s) => s.elapsedSeconds);
  return (
    <span className={className} style={style}>
      {formatTimerHMS(elapsed)}
    </span>
  );
}
