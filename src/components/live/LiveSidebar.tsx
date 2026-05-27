import { useRecordingStore } from '@/store/recordingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { SideCard, SideCardLabel } from '@/components/ui/SideCard';
import { BarRow } from '@/components/ui/BarRow';
import { Waveform } from './Waveform';
import { LiveTimer } from './LiveTimer';
import shared from '@/screens/screens.module.css';
import styles from './LiveSidebar.module.css';

/** Right-hand column of the Live screen: metadata, input meter, session stats. */
export function LiveSidebar() {
  const userCefr = useSettingsStore((s) => s.userCefr);
  const paragraphs = useRecordingStore((s) => s.paragraphs);

  let verbs = 0;
  let cases = 0;
  let syntax = 0;
  for (const p of paragraphs) {
    for (const sentence of p.sentences) {
      for (const h of sentence.highlights) {
        if (h.type === 'verb') verbs++;
        else if (h.type === 'case') cases++;
        else if (h.type === 'syntax') syntax++;
      }
    }
  }
  const maxH = Math.max(verbs, cases, syntax, 1);

  return (
    <aside className={shared.sideColumn}>
      <SideCard>
        <SideCardLabel>Capture metadata</SideCardLabel>
        <div className={styles.meta}>
          <MetaRow label="Engine" value="Deepgram Nova-3 · German" />
          <MetaRow label="Analysis" value="Gemini 2.5 Flash" />
          <MetaRow label="Storage" value="Local · IndexedDB-bound" />
          <MetaRow label="Calibration" value={`${userCefr} learner`} />
        </div>
      </SideCard>

      <SideCard>
        <div className={styles.inputHeader}>
          <SideCardLabel>Input level</SideCardLabel>
          <LiveTimer className={styles.inputTimer} />
        </div>
        <Waveform />
        <span className={styles.captureNote}>Healthy capture · no clipping detected</span>
      </SideCard>

      <SideCard>
        <SideCardLabel>Detected this session</SideCardLabel>
        <BarRow name="Verbs flagged" pct={(verbs / maxH) * 100} value={verbs} />
        <BarRow name="Cases flagged" pct={(cases / maxH) * 100} value={cases} />
        <BarRow name="Syntax flagged" pct={(syntax / maxH) * 100} value={syntax} accent />
      </SideCard>
    </aside>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaRow}>
      <span className={styles.metaLbl}>{label}</span>
      <span className={styles.metaVal}>{value}</span>
    </div>
  );
}
