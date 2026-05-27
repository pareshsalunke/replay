import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { RecordingBanner } from './RecordingBanner';
import styles from './AppShell.module.css';

/** The app frame: top bar + sidebar grid, with the routed screen in main. */
export function AppShell() {
  return (
    <div className={styles.app}>
      <TopBar />
      <Sidebar />
      <main className={styles.main}>
        <RecordingBanner />
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
