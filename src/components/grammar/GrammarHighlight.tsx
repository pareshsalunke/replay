import type { Highlight } from '@/types';
import { useGrammarStore } from '@/store/grammarStore';
import styles from './HighlightedText.module.css';

interface GrammarHighlightProps {
  /** The displayed (highlighted) substring. */
  text: string;
  highlight: Highlight;
  /** Full parent sentence — passed to the grammar drawer for context. */
  sentence: string;
}

/** A clickable, underlined grammar highlight. Opens the deep-dive drawer. */
export function GrammarHighlight({ text, highlight, sentence }: GrammarHighlightProps) {
  const open = useGrammarStore((s) => s.open);

  const handleOpen = () => {
    open({
      word: highlight.text,
      type: highlight.type,
      sentence,
      reason: highlight.reason,
      correction: highlight.correction ?? '',
      alternatives: highlight.alternatives ?? [],
    });
  };

  return (
    <span
      className={styles[`grammar-${highlight.type}`]}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        handleOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
    >
      {text}
    </span>
  );
}
