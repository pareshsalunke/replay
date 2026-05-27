import { useNavigate, useParams } from 'react-router-dom';
import type { Sentence } from '@/types';
import { useSessionsStore } from '@/store/sessionsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { sessionTotals } from '@/lib/stats';
import { cefrLabel, masteryPct } from '@/lib/cefr';
import { formatDuration } from '@/lib/format';
import { downloadSession } from '@/lib/export';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { SideCard, SideCardLabel } from '@/components/ui/SideCard';
import { TranscriptParagraph } from '@/components/studio/TranscriptParagraph';
import shared from './screens.module.css';
import styles from './StudioScreen.module.css';

const PARA_SIZE = 3;

/** Transcript Studio — review a saved session with grammar highlights. */
export function StudioScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = useSessionsStore((s) =>
    id ? s.sessions.find((x) => x.id === id) : undefined,
  );
  const exportFormat = useSettingsStore((s) => s.exportFormat);

  if (!session) {
    return (
      <div className={shared.pageHead}>
        <h1>Select a session from the Archive</h1>
        <p>Open a recorded session to review its transcript and grammar analysis.</p>
        <div className={shared.pageActions}>
          <Button onClick={() => navigate('/')}>Back to Archive</Button>
        </div>
      </div>
    );
  }

  const date = new Date(session.date);
  const cefr = session.overallCefr || 'B1';
  const totals = sessionTotals(session);
  const sentences = session.sentences || [];

  // Group sentences into paragraphs of PARA_SIZE.
  const groups: { startIndex: number; sentences: Sentence[] }[] = [];
  for (let i = 0; i < sentences.length; i += PARA_SIZE) {
    groups.push({ startIndex: i, sentences: sentences.slice(i, i + PARA_SIZE) });
  }

  return (
    <>
      <div className={shared.pageHead}>
        <Pill level={cefr} style={{ marginBottom: 10, display: 'inline-flex' }}>
          Level {cefr} · {cefrLabel(cefr)}
        </Pill>
        <h1>{session.title}</h1>
        <p>
          Recorded{' '}
          {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          {' · '}
          {formatDuration(session.durationSeconds || 0)}
        </p>
        <div className={shared.pageActions}>
          <Button icon="export" onClick={() => downloadSession(session, exportFormat)}>
            Export
          </Button>
          <Button onClick={() => navigate('/')}>Back to Archive</Button>
          <span className={styles.countMeta}>
            <span style={{ color: 'var(--ink-2)' }}>{cefr}</span> · {sentences.length} sentences
          </span>
        </div>
      </div>

      <div className={shared.liveGrid}>
        <div className={shared.transcript}>
          <div className={shared.cardHead}>
            <h3>Transcript</h3>
            <span className={shared.headRight}>Click any underlined term for grammar deep-dive</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {groups.length === 0 ? (
              <div className={shared.emptyState}>This session has no transcribed sentences.</div>
            ) : (
              groups.map((g) => (
                <TranscriptParagraph
                  key={g.startIndex}
                  startIndex={g.startIndex}
                  sentences={g.sentences}
                />
              ))
            )}
          </div>
        </div>

        <aside className={shared.sideColumn}>
          <SideCard>
            <SideCardLabel>Calibration</SideCardLabel>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>{cefr}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>overall CEFR</span>
            </div>
            <div className={styles.masteryTrack}>
              <span className={styles.masteryFill} style={{ width: `${masteryPct(cefr)}%` }} />
            </div>
          </SideCard>

          <SideCard>
            <SideCardLabel>Highlighted constructs</SideCardLabel>
            <ConstructRow name="Verb forms" value={totals.verbs} />
            <ConstructRow name="Cases" value={totals.cases} />
            <ConstructRow name="Syntax" value={totals.syntax} />
            <ConstructRow name="Vocabulary" value={totals.vocab} />
          </SideCard>
        </aside>
      </div>
    </>
  );
}

function ConstructRow({ name, value }: { name: string; value: number }) {
  return (
    <div className={styles.constructRow}>
      <span className={styles.constructName}>{name}</span>
      <span className={styles.constructValue}>{value}</span>
    </div>
  );
}
