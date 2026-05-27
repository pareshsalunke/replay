import { Icon } from '@/components/ui/Icon';
import { useUiStore } from '@/store/uiStore';
import styles from './TopBar.module.css';

/** Top bar: brand, (inert) search, profile + settings actions. */
export function TopBar() {
  const openSettings = useUiStore((s) => s.openSettings);

  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>Replay</div>
      <div className={styles.spacer} />
      <label className={styles.search}>
        <Icon name="search" size={14} />
        <input placeholder="Search transcripts, lexicon, grammar…" />
        <span className={styles.kbd}>⌘K</span>
      </label>
      <div className={styles.actions}>
        <button className={styles.iconBtn} title="Profile" type="button">
          <Icon name="user" size={16} />
        </button>
        <button
          className={styles.iconBtn}
          title="Settings"
          type="button"
          onClick={openSettings}
        >
          <Icon name="settings" size={16} />
        </button>
      </div>
    </header>
  );
}
