import { useEffect, useMemo, useState } from 'react';
import type { Cefr, ConstructType, LexiconEntry } from '@/types';
import { useSessionsStore } from '@/store/sessionsStore';
import { useGrammarStore } from '@/store/grammarStore';
import {
  buildLexiconEntries,
  filterLexicon,
  hasActiveFilters,
  EMPTY_LEXICON_FILTERS,
  type LexiconFilters,
} from '@/lib/lexicon';
import { grammarTypeColor } from '@/lib/insights';
import { CEFR_ORDER } from '@/lib/cefr';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { Segmented } from '@/components/ui/Segmented';
import { Icon } from '@/components/ui/Icon';
import { Flashcard } from '@/components/lexicon/Flashcard';
import shared from './screens.module.css';
import styles from './LexiconScreen.module.css';

type View = 'list' | 'cards';

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'cards', label: 'Flashcards' },
];

const TYPE_OPTIONS: { value: ConstructType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'verb', label: 'Verb' },
  { value: 'case', label: 'Case' },
  { value: 'syntax', label: 'Syntax' },
  { value: 'vocab', label: 'Vocab' },
];

const CEFR_OPTIONS: { value: Cefr | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...CEFR_ORDER.map((c) => ({ value: c, label: c })),
];

/** Lexicon — every flagged word across sessions, as a list or flashcards. */
export function LexiconScreen() {
  const sessions = useSessionsStore((s) => s.sessions);
  const openDrawerStore = useGrammarStore((s) => s.open);

  const [view, setView] = useState<View>('list');
  const [filters, setFilters] = useState<LexiconFilters>(EMPTY_LEXICON_FILTERS);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const all = useMemo(() => buildLexiconEntries(sessions), [sessions]);
  const entries = useMemo(() => filterLexicon(all, filters), [all, filters]);

  // Any change to the visible set resets the flashcard position.
  useEffect(() => {
    setCardIndex(0);
    setFlipped(false);
  }, [entries]);

  const openDrawer = (e: LexiconEntry) =>
    openDrawerStore({
      word: e.text,
      type: e.type,
      sentence: e.exampleSentence,
      reason: e.reason,
      correction: e.correction,
      alternatives: e.alternatives,
    });

  // Flashcard keyboard navigation (only while in card view).
  useEffect(() => {
    if (view !== 'cards') return;
    const onKey = (ev: KeyboardEvent) => {
      if (useGrammarStore.getState().isOpen) return;
      const t = ev.target as HTMLElement | null;
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        setFlipped(false);
        setCardIndex((i) => Math.min(i + 1, entries.length - 1));
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        setFlipped(false);
        setCardIndex((i) => Math.max(i - 1, 0));
      } else if (ev.key === ' ' || ev.key === 'Enter') {
        ev.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, entries.length]);

  const go = (delta: number) => {
    setFlipped(false);
    setCardIndex((i) => Math.max(0, Math.min(i + delta, entries.length - 1)));
  };

  const current = entries[cardIndex];

  return (
    <>
      <div className={shared.pageHead}>
        <h1>Lexicon</h1>
        <p>
          Every word and phrase flagged across your sessions — browse the list or study them as
          flashcards.
        </p>
        <div className={shared.pageActions}>
          <Segmented options={VIEW_OPTIONS} value={view} onChange={setView} />
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
            {entries.length} of {all.length} term{all.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {all.length === 0 ? (
        <Card>
          <div className={shared.emptyState}>
            <strong>No flagged words yet</strong>
            Record and analyze a session to build your lexicon.
          </div>
        </Card>
      ) : (
        <>
          <div className={styles.filters}>
            <Segmented
              options={TYPE_OPTIONS}
              value={filters.type}
              onChange={(type) => setFilters((f) => ({ ...f, type }))}
            />
            <Segmented
              options={CEFR_OPTIONS}
              value={filters.cefr}
              onChange={(cefr) => setFilters((f) => ({ ...f, cefr }))}
            />
            <select
              className={styles.select}
              value={filters.sessionId}
              onChange={(e) => setFilters((f) => ({ ...f, sessionId: e.target.value }))}
            >
              <option value="all">All sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            {hasActiveFilters(filters) && (
              <Button onClick={() => setFilters(EMPTY_LEXICON_FILTERS)}>Clear</Button>
            )}
          </div>

          {entries.length === 0 ? (
            <Card>
              <div className={shared.emptyState}>
                <strong>No terms match these filters</strong>
                Try widening or clearing the filters.
              </div>
            </Card>
          ) : view === 'list' ? (
            <Card title="Flagged vocabulary">
              {entries.map((e) => (
                <LexiconRow key={e.id} entry={e} onOpen={() => openDrawer(e)} />
              ))}
            </Card>
          ) : (
            current && (
              <div className={styles.cards}>
                <Flashcard
                  entry={current}
                  flipped={flipped}
                  onFlip={() => setFlipped((f) => !f)}
                  onPractice={() => openDrawer(current)}
                />
                <div className={styles.cardNav}>
                  <Button icon="arrowRight" className={styles.prev} onClick={() => go(-1)} disabled={cardIndex === 0}>
                    Prev
                  </Button>
                  <span className={styles.position}>
                    {cardIndex + 1} / {entries.length}
                  </span>
                  <Button
                    icon="arrowRight"
                    onClick={() => go(1)}
                    disabled={cardIndex === entries.length - 1}
                  >
                    Next
                  </Button>
                </div>
                <span className={styles.kbdHint}>← → to navigate · Space to flip</span>
              </div>
            )
          )}
        </>
      )}
    </>
  );
}

interface LexiconRowProps {
  entry: LexiconEntry;
  onOpen: () => void;
}

function LexiconRow({ entry, onOpen }: LexiconRowProps) {
  const color = grammarTypeColor(entry.type);
  const date = new Date(entry.lastSeenDate).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <button className={styles.row} type="button" onClick={onOpen}>
      <span className={styles.word} style={{ color }}>
        {entry.hasError && <span className={styles.needsDot} aria-label="needs work" />}
        {entry.text}
        {entry.count > 1 && <span className={styles.count}>×{entry.count}</span>}
      </span>
      <Pill style={{ borderColor: `${color}55`, color, background: `${color}10` }}>
        {entry.type}
      </Pill>
      <span className={styles.reason}>{entry.reason}</span>
      <span className={styles.example}>{entry.exampleSentence}</span>
      <span className={styles.date}>{date}</span>
      <Icon name="arrowRight" size={14} className={styles.arrow} />
    </button>
  );
}
