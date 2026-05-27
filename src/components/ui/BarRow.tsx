import type { ReactNode } from 'react';
import styles from './BarRow.module.css';

interface BarRowProps {
  name: string;
  /** Fill width as a percentage (0–100). */
  pct: number;
  /** Value shown on the right (e.g. a count). */
  value: ReactNode;
  /** Use the accent fill color instead of ink. */
  accent?: boolean;
}

/** Labelled progress bar row — ports the prototype's `.sj-bar-row`. */
export function BarRow({ name, pct, value, accent }: BarRowProps) {
  const fillCls = [styles.fill, accent && styles.accent].filter(Boolean).join(' ');
  return (
    <div className={styles.barRow}>
      <span className={styles.name}>{name}</span>
      <span className={styles.track}>
        <span className={fillCls} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </span>
      <span className={styles.pct}>{value}</span>
    </div>
  );
}
