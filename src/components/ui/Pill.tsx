import type { CSSProperties, ReactNode } from 'react';
import type { Cefr } from '@/types';
import styles from './Pill.module.css';

interface PillProps {
  children: ReactNode;
  /** Apply CEFR-level coloring (a/b/c bands). */
  level?: Cefr;
  className?: string;
  style?: CSSProperties;
}

/** Small uppercase label — ports the prototype's `.sj-pill` (incl. CEFR levels). */
export function Pill({ children, level, className, style }: PillProps) {
  const cls = [styles.pill, level && styles[`level-${level.toLowerCase()}`], className]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={cls} style={style}>
      {children}
    </span>
  );
}
