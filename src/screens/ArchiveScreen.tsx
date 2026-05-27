import { useNavigate } from 'react-router-dom';
import type { Session } from '@/types';
import { useSessionsStore } from '@/store/sessionsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUiStore } from '@/store/uiStore';
import { useRecordingControls } from '@/context/RecordingControls';
import { archiveTotals } from '@/lib/stats';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { BarRow } from '@/components/ui/BarRow';
import { Icon } from '@/components/ui/Icon';
import shared from './screens.module.css';
import styles from './ArchiveScreen.module.css';

const TABS = ['All', 'Recent', 'Flagged', 'Drafts'];

/** Archive — the session ledger and aggregate KPIs. */
export function ArchiveScreen() {
  const sessions = useSessionsStore((s) => s.sessions);
  const userCefr = useSettingsStore((s) => s.userCefr);
  const openSettings = useUiStore((s) => s.openSettings);
  const { beginRecording } = useRecordingControls();
  const navigate = useNavigate();

  const totals = archiveTotals(sessions);
  const maxH = Math.max(totals.verbs, totals.cases, totals.syntax, 1);
  const hours = (totals.totalSeconds / 3600).toFixed(1);
  const summary = `${sessions.length} session${sessions.length !== 1 ? 's' : ''} · ${hours}h`;

  return (
    <>
      <div className={shared.pageHead}>
        <h1>Archive</h1>
        <p>
          A systematic inventory of verbal exchanges, recorded for grammatical refinement and
          lexical expansion.
        </p>
        <div className={shared.pageActions}>
          <Button variant="primary" icon="plus" onClick={beginRecording}>
            New entry
          </Button>
          <Button onClick={openSettings}>Configure</Button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{summary}</span>
        </div>
      </div>

      <div className={shared.tabRow}>
        {TABS.map((t, i) => (
          <button key={t} className={shared.tab} type="button" aria-selected={i === 0}>
            {t}
          </button>
        ))}
      </div>

      <Card
        title="The daily log"
        headerRight={<span className={shared.headRight}>Sorted by time · descending</span>}
      >
        {sessions.length === 0 ? (
          <div className={shared.emptyState}>
            <strong>No sessions yet</strong>
            Click <em>New entry</em> to start your first recording.
          </div>
        ) : (
          sessions.map((s) => (
            <MeetingRow key={s.id} session={s} onOpen={() => navigate(`/studio/${s.id}`)} />
          ))
        )}
      </Card>

      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <span className={styles.kLabel}>Vocabulary growth</span>
          <span className={styles.kValue}>{totals.totalHighlights}</span>
          <BarRow name="Verbs" pct={(totals.verbs / maxH) * 100} value={totals.verbs} />
          <BarRow name="Cases" pct={(totals.cases / maxH) * 100} value={totals.cases} />
          <BarRow name="Syntax" pct={(totals.syntax / maxH) * 100} value={totals.syntax} accent />
          <span className={styles.kFoot}>Lexical items extracted across all sessions</span>
        </div>

        <div className={styles.kpi}>
          <span className={styles.kLabel}>Sessions logged</span>
          <span className={styles.kValue}>{sessions.length}</span>
          <span className={styles.kFoot}>Total recorded German conversations</span>
        </div>

        <div className={styles.kpi}>
          <span className={styles.kLabel}>Mastery target</span>
          <span className={styles.kValue}>{userCefr}</span>
          <span className={styles.kFoot} style={{ marginTop: 6 }}>
            Current self-assessed CEFR · adjust in Settings
          </span>
          <Button onClick={openSettings} style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
            Adjust level
          </Button>
        </div>
      </div>
    </>
  );
}

interface MeetingRowProps {
  session: Session;
  onOpen: () => void;
}

function MeetingRow({ session, onOpen }: MeetingRowProps) {
  const date = new Date(session.date);
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const cefr = session.overallCefr || 'B1';

  return (
    <button className={styles.listRow} type="button" onClick={onOpen}>
      <span className={styles.time}>{timeStr}</span>
      <span>
        <div className={styles.title}>{session.title}</div>
        <div className={styles.sub}>{dateStr}</div>
      </span>
      <Pill level={cefr}>{cefr}</Pill>
      <Icon name="arrowRight" size={14} className={styles.arrow} />
    </button>
  );
}
