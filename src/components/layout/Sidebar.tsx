import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useUiStore } from '@/store/uiStore';
import { useSessionsStore } from '@/store/sessionsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useRecordingControls } from '@/context/RecordingControls';
import { buildLexiconEntries } from '@/lib/lexicon';
import styles from './Sidebar.module.css';

/** Left workspace navigation, New-entry CTA, privacy note, and profile. */
export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const openSettings = useUiStore((s) => s.openSettings);
  const sessions = useSessionsStore((s) => s.sessions);
  const userCefr = useSettingsStore((s) => s.userCefr);
  const { beginRecording } = useRecordingControls();

  const lexiconCount = useMemo(() => buildLexiconEntries(sessions).length, [sessions]);

  const goTranscripts = () => {
    if (sessions.length > 0) navigate(`/studio/${sessions[0].id}`);
    else navigate('/');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sectionLabel}>Workspace</div>
      <div className={styles.nav}>
        <NavItem
          icon="archive"
          label="Archive"
          count={sessions.length}
          active={pathname === '/'}
          onClick={() => navigate('/')}
        />
        <NavItem
          icon="mic"
          label="Live session"
          active={pathname === '/live'}
          onClick={() => navigate('/live')}
        />
        <NavItem
          icon="history"
          label="Transcripts"
          count={sessions.length}
          active={pathname.startsWith('/studio')}
          onClick={goTranscripts}
        />
        <NavItem
          icon="insights"
          label="Insights"
          active={pathname === '/insights'}
          onClick={() => navigate('/insights')}
        />
        <NavItem
          icon="book"
          label="Lexicon"
          count={lexiconCount}
          active={pathname === '/lexicon'}
          onClick={() => navigate('/lexicon')}
        />
        <NavItem
          icon="grammar"
          label="Grammar lab"
          onClick={() => window.alert('Grammar lab — coming in V1.5')}
        />
        <NavItem icon="settings" label="Settings" onClick={openSettings} />
      </div>

      <button className={styles.newBtn} type="button" onClick={beginRecording}>
        <Icon name="plus" size={14} strokeWidth={1.8} />
        New entry
      </button>

      <div className={styles.spacer} />

      <div className={styles.privacy}>
        <Icon name="lock" size={12} />
        Sessions stored on this device · audio to Deepgram, text to Gemini
      </div>

      <div className={styles.profile}>
        <span className={styles.avatar}>PS</span>
        <div className={styles.who}>
          <b>Paresh Salunke</b>
          <span>Professional · {userCefr}</span>
        </div>
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: IconName;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, count, active, onClick }: NavItemProps) {
  return (
    <button
      className={styles.navItem}
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      <span className={styles.ico}>
        <Icon name={icon} size={15} />
      </span>
      <span>{label}</span>
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
}
