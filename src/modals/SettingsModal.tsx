import { useState } from 'react';
import type { Cefr, ExportFormat } from '@/types';
import { useUiStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Segmented } from '@/components/ui/Segmented';
import { Icon } from '@/components/ui/Icon';
import styles from './modals.module.css';

const CEFR_OPTIONS: { value: Cefr; label: string }[] = [
  { value: 'A1', label: 'A1 — Beginner' },
  { value: 'A2', label: 'A2 — Elementary' },
  { value: 'B1', label: 'B1 — Intermediate' },
  { value: 'B2', label: 'B2 — Upper Intermediate' },
  { value: 'C1', label: 'C1 — Advanced' },
  { value: 'C2', label: 'C2 — Mastery' },
];

/** Settings modal — API keys, toggles, CEFR level, export format. */
export function SettingsModal() {
  const open = useUiStore((s) => s.settingsOpen);
  const close = useUiStore((s) => s.closeSettings);
  return (
    <Modal open={open} onClose={close} width={540}>
      <SettingsForm onDone={close} />
    </Modal>
  );
}

/** Inner form — re-mounts (fresh state) each time the modal opens. */
function SettingsForm({ onDone }: { onDone: () => void }) {
  const save = useSettingsStore((s) => s.save);
  const [deepgramKey, setDeepgramKey] = useState(() => useSettingsStore.getState().deepgramKey);
  const [geminiKey, setGeminiKey] = useState(() => useSettingsStore.getState().geminiKey);
  const [autoDetect, setAutoDetect] = useState(() => useSettingsStore.getState().autoDetect);
  const [localStorageOnly, setLocalStorageOnly] = useState(
    () => useSettingsStore.getState().localStorageOnly,
  );
  const [userCefr, setUserCefr] = useState<Cefr>(() => useSettingsStore.getState().userCefr);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(
    () => useSettingsStore.getState().exportFormat,
  );

  const handleSave = () => {
    save({ deepgramKey, geminiKey, autoDetect, localStorageOnly, userCefr, exportFormat });
    onDone();
  };

  return (
    <>
      <div className={styles.head}>
        <div>
          <h3 className={styles.title}>Settings</h3>
          <div className={styles.kicker}>System preferences</div>
        </div>
        <button className={styles.iconBtn} type="button" onClick={onDone} aria-label="Close">
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className={styles.body}>
        <div className={`${styles.rowSetting} ${styles.rowStacked}`}>
          <div>
            <div className={styles.rowName}>Deepgram API key</div>
            <div className={styles.rowDesc}>Used for live German transcription. Stored locally.</div>
          </div>
          <input
            className={styles.input}
            type="password"
            placeholder="••••••••••••••••"
            value={deepgramKey}
            onChange={(e) => setDeepgramKey(e.target.value)}
          />
        </div>

        <div className={`${styles.rowSetting} ${styles.rowStacked}`}>
          <div>
            <div className={styles.rowName}>Gemini API key</div>
            <div className={styles.rowDesc}>
              Used for grammar analysis, translation, and deep-dives. Stored locally.
            </div>
          </div>
          <input
            className={styles.input}
            type="password"
            placeholder="••••••••••••••••"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
          />
        </div>

        <div className={styles.rowSetting}>
          <div>
            <div className={styles.rowName}>Auto-detect meetings</div>
            <div className={styles.rowDesc}>
              Sync with calendar events for real-time transcription. (Coming in V2)
            </div>
          </div>
          <Toggle checked={autoDetect} onChange={setAutoDetect} aria-label="Auto-detect meetings" />
        </div>

        <div className={styles.rowSetting}>
          <div>
            <div className={styles.rowName}>Local-only storage</div>
            <div className={styles.rowDesc}>
              Keep all transcripts on this device. Never sync to cloud.
            </div>
          </div>
          <Toggle
            checked={localStorageOnly}
            onChange={setLocalStorageOnly}
            aria-label="Local-only storage"
          />
        </div>

        <div className={styles.rowSetting}>
          <div>
            <div className={styles.rowName}>Your CEFR level</div>
            <div className={styles.rowDesc}>
              Used to calibrate grammar explanations and alternative phrasings to your level.
            </div>
          </div>
          <select
            className={`${styles.input} ${styles.select}`}
            value={userCefr}
            onChange={(e) => setUserCefr(e.target.value as Cefr)}
          >
            {CEFR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.rowSetting}>
          <div>
            <div className={styles.rowName}>Export format</div>
            <div className={styles.rowDesc}>File format used when saving sessions to disk.</div>
          </div>
          <Segmented
            options={[
              { value: 'md', label: '.md' },
              { value: 'txt', label: '.txt' },
            ]}
            value={exportFormat}
            onChange={setExportFormat}
          />
        </div>

        <div className={styles.callout} style={{ marginTop: 16 }}>
          <span className={styles.calloutLabel}>Privacy note</span>
          API keys are stored locally in your browser. Audio is sent to Deepgram for transcription
          and sentences to Google Gemini for analysis. Enable Local-only storage to keep transcripts
          on-device.
        </div>

        <Button
          variant="primary"
          className={styles.fullBtn}
          style={{ padding: 11, marginTop: 16 }}
          onClick={handleSave}
        >
          Save configuration
        </Button>
      </div>
    </>
  );
}
