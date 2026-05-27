import { useRecordingStore } from '@/store/recordingStore';
import { LiveParagraphBlock } from './LiveParagraphBlock';
import { InterimBlock } from './InterimBlock';
import shared from '@/screens/screens.module.css';
import styles from './live.module.css';

/** The scrolling live transcript: finalized paragraphs + interim fragment. */
export function LiveFeed() {
  const paragraphs = useRecordingStore((s) => s.paragraphs);
  const hasInterim = useRecordingStore((s) => s.interimText.length > 0);
  const liveError = useRecordingStore((s) => s.liveError);

  const isEmpty = paragraphs.length === 0 && !hasInterim;

  if (liveError) {
    return (
      <div className={styles.feed}>
        <div className={styles.error}>{liveError}</div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={styles.feed}>
        <div className={shared.emptyState}>
          <strong>Click New entry to begin</strong>
          Live transcription starts once the mic is connected to Deepgram.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feed}>
      {paragraphs.map((p) => (
        <LiveParagraphBlock key={p.id} paragraph={p} />
      ))}
      <InterimBlock />
    </div>
  );
}
