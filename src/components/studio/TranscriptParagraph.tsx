import { Fragment } from 'react';
import type { Sentence } from '@/types';
import { modeCefr } from '@/lib/cefr';
import { formatSeconds } from '@/lib/format';
import { HighlightedText } from '@/components/grammar/HighlightedText';
import styles from './TranscriptParagraph.module.css';

interface TranscriptParagraphProps {
  /** Index of the first sentence — drives the timestamp. */
  startIndex: number;
  sentences: Sentence[];
}

/** One transcript paragraph: timestamp, flowing sentences, group CEFR badge. */
export function TranscriptParagraph({ startIndex, sentences }: TranscriptParagraphProps) {
  const cefr = modeCefr(sentences.map((s) => s.cefr).filter(Boolean)) ?? '—';

  return (
    <div className={styles.row}>
      <span className={styles.ts}>{formatSeconds(startIndex * 8)}</span>
      <p className={styles.text}>
        {sentences.map((s, i) => (
          <Fragment key={i}>
            {i > 0 && ' '}
            <HighlightedText
              text={s.text}
              highlights={s.highlights}
              translation={s.translation || undefined}
            />
          </Fragment>
        ))}
      </p>
      <span className={styles.cefrTag}>{cefr}</span>
    </div>
  );
}
