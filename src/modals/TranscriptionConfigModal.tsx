import { useState } from 'react';
import { useUiStore } from '@/store/uiStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Icon } from '@/components/ui/Icon';
import styles from './modals.module.css';

/** Transcription configuration modal. The toggles are cosmetic (no effect). */
export function TranscriptionConfigModal() {
  const open = useUiStore((s) => s.transcriptionConfigOpen);
  const close = useUiStore((s) => s.closeTranscriptionConfig);
  return (
    <Modal open={open} onClose={close} width={460}>
      <TranscriptionConfigForm onClose={close} />
    </Modal>
  );
}

function TranscriptionConfigForm({ onClose }: { onClose: () => void }) {
  const [translation, setTranslation] = useState(true);
  const [accent, setAccent] = useState(false);
  const [tags, setTags] = useState(true);

  return (
    <>
      <div className={styles.head}>
        <div>
          <h3 className={styles.title}>Transcription configuration</h3>
          <div className={styles.kicker}>System preferences · Deepgram + Gemini</div>
        </div>
        <button className={styles.iconBtn} type="button" onClick={onClose} aria-label="Close">
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.rowSetting}>
          <div>
            <div className={styles.rowName}>Real-time translation</div>
            <div className={styles.rowDesc}>English equivalents for all transcribed phrases.</div>
          </div>
          <Toggle checked={translation} onChange={setTranslation} aria-label="Real-time translation" />
        </div>

        <div className={styles.rowSetting}>
          <div>
            <div className={styles.rowName}>Accent adaptation</div>
            <div className={styles.rowDesc}>Normalize regional dialectal variations.</div>
          </div>
          <Toggle checked={accent} onChange={setAccent} aria-label="Accent adaptation" />
        </div>

        <div className={styles.rowSetting}>
          <div>
            <div className={styles.rowName}>Syntactic tags</div>
            <div className={styles.rowDesc}>Inline grammar type tags below each sentence.</div>
          </div>
          <Toggle checked={tags} onChange={setTags} aria-label="Syntactic tags" />
        </div>

        <div className={styles.btnRow}>
          <Button variant="primary" onClick={onClose}>
            Apply
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>
  );
}
