import { useEffect, useState } from 'react';
import type { GrammarType, Session, SessionContext } from '@/types';
import { useUiStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useSessionsStore } from '@/store/sessionsStore';
import { downloadSession } from '@/lib/export';
import { trackExport, trackFeedbackViewed } from '@/services/analytics';
import { formatDuration } from '@/lib/format';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { Segmented } from '@/components/ui/Segmented';
import { Icon } from '@/components/ui/Icon';
import modal from './modals.module.css';
import styles from './SessionSummaryModal.module.css';

const TYPE_COLORS: Record<GrammarType, string> = {
  verb: '#d46a43',
  case: '#3a5a78',
  syntax: '#5a7156',
  vocab: '#8b5e83',
  lexicon: '#8b5e83',
};

const CONTEXT_OPTIONS: { value: SessionContext; label: string }[] = [
  { value: 'class', label: 'Class' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'work', label: 'Work' },
  { value: 'testing', label: 'Just testing' },
];

/** Post-session summary. Dismissing it exports the session to disk. */
export function SessionSummaryModal() {
  const session = useUiStore((s) => s.summarySession);
  const closeSummary = useUiStore((s) => s.closeSummary);
  const exportFormat = useSettingsStore((s) => s.exportFormat);

  const handleDismiss = () => {
    if (session) {
      // Re-read so the context the user just picked is reflected in the export.
      const latest = useSessionsStore.getState().getById(session.id) ?? session;
      downloadSession(latest, exportFormat);
      trackExport(exportFormat);
    }
    closeSummary();
  };

  return (
    <Modal open={session !== null} onClose={handleDismiss} width={520}>
      {session && <SummaryContent session={session} onDismiss={handleDismiss} />}
    </Modal>
  );
}

function SummaryContent({ session, onDismiss }: { session: Session; onDismiss: () => void }) {
  const sentences = session.sentences || [];
  const highlights = sentences.flatMap((s) => s.highlights || []);
  const [context, setContext] = useState<SessionContext>(session.context ?? 'testing');

  useEffect(() => {
    trackFeedbackViewed(sentences.length);
  }, [sentences.length]);

  const handleContextChange = (next: SessionContext) => {
    setContext(next);
    useSessionsStore.getState().addOrUpdate({ ...session, context: next });
  };

  const typeCounts = new Map<GrammarType, number>();
  for (const h of highlights) typeCounts.set(h.type, (typeCounts.get(h.type) ?? 0) + 1);

  const uniqueWords = new Set(highlights.map((h) => h.text));
  const wordCount = uniqueWords.size;

  return (
    <>
      <div className={modal.head}>
        <div>
          <div className={styles.completeKicker}>Session complete</div>
          <h3 className={styles.summaryTitle}>{session.title || 'Untitled session'}</h3>
        </div>
        <button className={modal.iconBtn} type="button" onClick={onDismiss} aria-label="Close">
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Duration</div>
          <div className={styles.statValue}>{formatDuration(session.durationSeconds || 0)}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Sentences</div>
          <div className={styles.statValue}>{sentences.length}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>CEFR</div>
          <div className={styles.statValue}>{session.overallCefr || '—'}</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Where was this?</div>
        <Segmented options={CONTEXT_OPTIONS} value={context} onChange={handleContextChange} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Grammar patterns flagged</div>
        <div className={styles.breakdown}>
          {typeCounts.size === 0 ? (
            <span className={styles.noneFlagged}>None flagged</span>
          ) : (
            [...typeCounts.entries()].map(([type, n]) => {
              const c = TYPE_COLORS[type];
              return (
                <Pill
                  key={type}
                  style={{ borderColor: `${c}55`, color: c, background: `${c}10` }}
                >
                  {type} · {n}
                </Pill>
              );
            })
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Words flagged for review</div>
        <div className={styles.vocabCount}>
          {wordCount} word{wordCount !== 1 ? 's' : ''}
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onDismiss} style={{ flex: 1, justifyContent: 'center' }}>
          Back to Archive
        </Button>
        <Button onClick={onDismiss}>Export file</Button>
      </div>
    </>
  );
}
