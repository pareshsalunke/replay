import { Fragment } from 'react';
import type { GrammarType, LiveParagraph } from '@/types';
import { formatSeconds } from '@/lib/format';
import { HighlightedText } from '@/components/grammar/HighlightedText';
import styles from './live.module.css';

/** Hex colors per grammar type, matching the design tokens. */
const TYPE_COLORS: Record<GrammarType, string> = {
  verb: '#d46a43',
  case: '#3a5a78',
  syntax: '#5a7156',
  vocab: '#8b5e83',
  lexicon: '#8b5e83',
};

interface LiveParagraphBlockProps {
  paragraph: LiveParagraph;
}

/** One finalized paragraph in the live feed (up to 3 sentences). */
export function LiveParagraphBlock({ paragraph }: LiveParagraphBlockProps) {
  return (
    <div className={styles.paraBlock}>
      <div className={styles.paraHeader}>
        <span className={styles.ts}>{formatSeconds(paragraph.startSeconds)}</span>
        <span className={styles.cefrLabel}>{paragraph.cefr || '…'}</span>
      </div>
      <div className={styles.paraText}>
        {paragraph.sentences.map((s, i) => (
          <Fragment key={s.id}>
            {i > 0 && ' '}
            <HighlightedText
              text={s.text}
              highlights={s.highlights}
              translation={s.translation || undefined}
            />
          </Fragment>
        ))}
      </div>
      {paragraph.tagTypes.length > 0 && (
        <div className={styles.tagsRow}>
          {paragraph.tagTypes.map((t) => (
            <TypeTag key={t} type={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TypeTag({ type }: { type: GrammarType }) {
  const c = TYPE_COLORS[type];
  return (
    <span
      className={styles.tag}
      style={{ background: `${c}12`, color: c, borderColor: `${c}44` }}
    >
      {type}
    </span>
  );
}
