import type { LexiconEntry } from '@/types';
import { grammarTypeColor } from '@/lib/insights';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import styles from './Flashcard.module.css';

interface FlashcardProps {
  entry: LexiconEntry;
  flipped: boolean;
  onFlip: () => void;
  /** Opens the grammar drawer for custom-sentence practice. */
  onPractice: () => void;
}

/**
 * A single flip card. Presentational only — the parent owns `flipped` and the
 * card index so keyboard navigation lives in one place (the screen).
 */
export function Flashcard({ entry, flipped, onFlip, onPractice }: FlashcardProps) {
  const color = grammarTypeColor(entry.type);

  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      aria-label={`Flashcard: ${entry.text}. Press Space to flip.`}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      {!flipped ? (
        <div className={styles.face}>
          <div className={styles.topRow}>
            <Pill style={{ borderColor: `${color}55`, color, background: `${color}10` }}>
              {entry.type}
            </Pill>
            {entry.count > 1 && <span className={styles.freq}>×{entry.count}</span>}
          </div>
          <div className={styles.word} style={{ color }}>
            {entry.text}
          </div>
          <div className={styles.hint}>Click or press Space to flip</div>
        </div>
      ) : (
        <div className={styles.face}>
          <div className={styles.topRow}>
            <Pill style={{ borderColor: `${color}55`, color, background: `${color}10` }}>
              {entry.type}
            </Pill>
            {entry.cefr && <Pill level={entry.cefr}>{entry.cefr}</Pill>}
          </div>

          <div className={styles.translation}>
            {entry.exampleTranslation || <span className={styles.muted}>No translation</span>}
          </div>

          {entry.reason && <div className={styles.reason}>{entry.reason}</div>}

          <blockquote className={styles.quote}>{entry.exampleSentence}</blockquote>

          {entry.correction && entry.correction.trim() !== '' && (
            <div className={styles.correction}>
              <span className={styles.correctionLabel}>Correction</span>
              {entry.correction}
            </div>
          )}

          <Button
            variant="primary"
            className={styles.practiceBtn}
            onClick={(e) => {
              e.stopPropagation();
              onPractice();
            }}
          >
            Practice this word
          </Button>
        </div>
      )}
    </div>
  );
}
