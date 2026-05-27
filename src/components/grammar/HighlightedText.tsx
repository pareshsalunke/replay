import { Fragment, useMemo } from 'react';
import type { Highlight } from '@/types';
import { computeHighlightSpans } from '@/lib/highlights';
import { GrammarHighlight } from './GrammarHighlight';
import styles from './HighlightedText.module.css';

interface HighlightedTextProps {
  text: string;
  highlights: Highlight[];
  /** When set, the sentence shows a translation tooltip on hover. */
  translation?: string;
}

/**
 * Render a sentence as plain text interleaved with clickable grammar
 * highlights — no `dangerouslySetInnerHTML`, React escapes all text nodes.
 */
export function HighlightedText({ text, highlights, translation }: HighlightedTextProps) {
  const segments = useMemo(() => computeHighlightSpans(text, highlights), [text, highlights]);

  return (
    <span className={translation ? styles.transcriptSentence : undefined}>
      {segments.map((seg, i) =>
        seg.kind === 'text' ? (
          <Fragment key={i}>{seg.text}</Fragment>
        ) : (
          <GrammarHighlight
            key={i}
            text={seg.text}
            highlight={seg.highlight}
            sentence={text}
          />
        ),
      )}
      {translation && <span className={styles.tooltip}>{translation}</span>}
    </span>
  );
}
